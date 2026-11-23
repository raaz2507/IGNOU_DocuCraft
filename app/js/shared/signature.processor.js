/**
 * SignatureProcessor
 * Handles background removal, alpha smoothing, auto-cropping, WebP serialization,
 * and Smart Royal Blue Ballpoint Ink conversion.
 * Single Responsibility: Client-side signature image optimization.
 */
export class SignatureProcessor {
	/**
	 * Processes an uploaded image File or DataURL into a transparent, cropped WebP data URL.
	 * @param {File|string} input - File object or Base64 data URL
	 * @param {Object} options
	 * @param {"blue"|"original"} [options.inkMode="blue"] - Ink mode: "blue" (Royal Blue Pen) or "original"
	 * @returns {Promise<{ dataUrl: string, rawDataUrl: string }>} WebP data URL and raw transparent data URL
	 */
	static process(input, { inkMode = "blue" } = {}) {
		return new Promise((resolve, reject) => {
			if (!input) {
				return reject(new Error("No input image provided"));
			}

			const loadImage = (src) => {
				const img = new Image();
				img.onerror = () => reject(new Error("Failed to load signature image"));
				img.onload = () => {
					try {
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d", { willReadFrequently: true });
						canvas.width = img.width;
						canvas.height = img.height;
						ctx.drawImage(img, 0, 0);

						const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
						const data = imgData.data;

						// Raw transparent data copy for switching modes without re-reading
						const rawCanvas = document.createElement("canvas");
						rawCanvas.width = img.width;
						rawCanvas.height = img.height;
						const rawCtx = rawCanvas.getContext("2d", { willReadFrequently: true });
						rawCtx.drawImage(img, 0, 0);
						const rawImgData = rawCtx.getImageData(0, 0, rawCanvas.width, rawCanvas.height);
						const rawData = rawImgData.data;

						let minX = canvas.width;
						let minY = canvas.height;
						let maxX = 0;
						let maxY = 0;
						let hasInk = false;

						for (let i = 0; i < data.length; i += 4) {
							const a = data[i + 3];

							// 1. If pixel is ALREADY transparent in PNG, NEVER make it opaque!
							if (a <= 10) {
								data[i + 3] = 0;
								rawData[i + 3] = 0;
								continue;
							}

							const r = data[i];
							const g = data[i + 1];
							const b = data[i + 2];

							// 2. Paper background threshold (for photos/scans on white/grey paper)
							const isPaper = (r > 185 && g > 185 && b > 185) || ((r + g + b) / 3 > 190);
							if (isPaper) {
								data[i + 3] = 0;    // Fully transparent
								rawData[i + 3] = 0; // Raw transparent
								continue;
							}

							// 3. Ink strokes
							const pixelIdx = i / 4;
							const px = pixelIdx % canvas.width;
							const py = Math.floor(pixelIdx / canvas.width);

							if (px < minX) minX = px;
							if (px > maxX) maxX = px;
							if (py < minY) minY = py;
							if (py > maxY) maxY = py;
							hasInk = true;

							// Raw transparent copy keeps original RGB and Alpha
							rawData[i] = r;
							rawData[i + 1] = g;
							rawData[i + 2] = b;
							rawData[i + 3] = a;

							// If Royal Blue ink mode selected: only recolor the ink strokes!
							if (inkMode === "blue") {
								const lum = 0.299 * r + 0.587 * g + 0.114 * b;
								const darkness = Math.max(0, Math.min(1, 1.0 - (lum / 200)));
								data[i]     = Math.round(12 + (1 - darkness) * 20);  // R: 12 - 32
								data[i + 1] = Math.round(55 + (1 - darkness) * 45);  // G: 55 - 100
								data[i + 2] = Math.round(140 + (1 - darkness) * 65); // B: 140 - 205
								data[i + 3] = a;
							} else {
								// Original ink: untouched
								data[i] = r;
								data[i + 1] = g;
								data[i + 2] = b;
								data[i + 3] = a;
							}
						}

						ctx.putImageData(imgData, 0, 0);
						rawCtx.putImageData(rawImgData, 0, 0);

						// Auto-crop tightly to signature ink bounds with 4px margin
						let webpResult;
						let rawWebpResult;
						if (hasInk && maxX > minX && maxY > minY) {
							const pad = 4;
							const cropX = Math.max(0, minX - pad);
							const cropY = Math.max(0, minY - pad);
							const cropW = Math.min(canvas.width - cropX, maxX - minX + pad * 2);
							const cropH = Math.min(canvas.height - cropY, maxY - minY + pad * 2);

							const cropCanvas = document.createElement("canvas");
							cropCanvas.width = cropW;
							cropCanvas.height = cropH;
							const cropCtx = cropCanvas.getContext("2d");
							cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
							webpResult = cropCanvas.toDataURL("image/webp", 0.95);

							const rawCropCanvas = document.createElement("canvas");
							rawCropCanvas.width = cropW;
							rawCropCanvas.height = cropH;
							const rawCropCtx = rawCropCanvas.getContext("2d");
							rawCropCtx.drawImage(rawCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
							rawWebpResult = rawCropCanvas.toDataURL("image/webp", 0.95);
						} else {
							webpResult = canvas.toDataURL("image/webp", 0.95);
							rawWebpResult = rawCanvas.toDataURL("image/webp", 0.95);
						}

						resolve({ dataUrl: webpResult, rawDataUrl: rawWebpResult });
					} catch (err) {
						reject(err);
					}
				};
				img.src = src;
			};

			if (typeof input === "string") {
				loadImage(input);
			} else {
				const reader = new FileReader();
				reader.onerror = () => reject(reader.error);
				reader.onload = (e) => loadImage(e.target.result);
				reader.readAsDataURL(input);
			}
		});
	}
}

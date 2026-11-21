/**
 * SignatureProcessor
 * Handles background removal, tight bounds calculation, auto-cropping, and WebP serialization.
 * Single Responsibility: Client-side signature image optimization.
 */
export class SignatureProcessor {
	/**
	 * Processes an uploaded image file into a transparent, cropped WebP data URL.
	 * @param {File} file
	 * @returns {Promise<string>} WebP data URL
	 */
	static process(file) {
		return new Promise((resolve, reject) => {
			if (!file) {
				return reject(new Error("No file provided"));
			}

			const reader = new FileReader();
			reader.onerror = () => reject(reader.error);
			reader.onload = (e) => {
				const img = new Image();
				img.onerror = () => reject(new Error("Failed to load image"));
				img.onload = () => {
					try {
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d", { willReadFrequently: true });
						canvas.width = img.width;
						canvas.height = img.height;
						ctx.drawImage(img, 0, 0);

						const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
						const data = imgData.data;

						let minX = canvas.width;
						let minY = canvas.height;
						let maxX = 0;
						let maxY = 0;
						let hasInk = false;

						// Threshold: Transparent background for light/grey paper
						for (let i = 0; i < data.length; i += 4) {
							const r = data[i];
							const g = data[i + 1];
							const b = data[i + 2];

							const isPaperBackground = (r > 185 && g > 185 && b > 185) || (r + g + b) / 3 > 195;
							if (isPaperBackground) {
								data[i + 3] = 0; // Alpha 0 = Fully transparent
							} else {
								const pixelIdx = i / 4;
								const px = pixelIdx % canvas.width;
								const py = Math.floor(pixelIdx / canvas.width);

								if (px < minX) minX = px;
								if (px > maxX) maxX = px;
								if (py < minY) minY = py;
								if (py > maxY) maxY = py;
								hasInk = true;
							}
						}

						ctx.putImageData(imgData, 0, 0);

						// Auto-crop tightly to signature ink bounds with 4px margin
						let webpResult;
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
						} else {
							webpResult = canvas.toDataURL("image/webp", 0.95);
						}

						resolve(webpResult);
					} catch (err) {
						reject(err);
					}
				};
				img.src = e.target.result;
			};
			reader.readAsDataURL(file);
		});
	}
}

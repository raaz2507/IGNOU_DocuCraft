/**
 * SignatureUploaderController
 * Single Responsibility: Manages digital signature image uploads, background removal,
 * transparent WebP processing, real-time preview, scale slider control, inclusion toggle,
 * Royal Blue vs Original ink mode switching, and localStorage caching.
 * Reusable across any signature field (Student Signature, Guide Signature, etc.).
 */
import { StorageService } from "./storage.service.js";
import { SignatureProcessor } from "./signature.processor.js";
import { I18nService } from "./i18n.service.js";

export class SignatureUploaderController {
	#storageKey;
	#rawStorageKey;
	#scaleStorageKey;
	#includeStorageKey;
	#inkStorageKey;
	#cssScaleVar;

	#signatureData = null;
	#rawSignatureData = null;
	#scale = 1.0;
	#isIncluded = true;
	#inkMode = "blue"; // "blue" | "original"

	#dom = {};
	#onUpdate = null;

	/**
	 * @param {Object} options
	 * @param {HTMLInputElement} options.fileInput
	 * @param {HTMLElement} options.previewContainer
	 * @param {HTMLImageElement} options.previewImg
	 * @param {HTMLButtonElement} options.removeBtn
	 * @param {HTMLInputElement} options.scaleSlider
	 * @param {HTMLElement} options.scaleValueBadge
	 * @param {HTMLInputElement} [options.includeToggle] - Checkbox to toggle inclusion on printed sheet
	 * @param {HTMLElement} [options.includeStatusBadge] - Badge indicating inclusion status
	 * @param {HTMLButtonElement} [options.btnInkBlue] - Pill button for Royal Blue ink
	 * @param {HTMLButtonElement} [options.btnInkOriginal] - Pill button for Original ink
	 * @param {string} [options.storageKey="signature_webp"]
	 * @param {string} [options.scaleStorageKey="signature_scale"]
	 * @param {string} [options.includeStorageKey="signature_included"]
	 * @param {string} [options.inkStorageKey="signature_ink_mode"]
	 * @param {string} [options.cssScaleVar="--sig-scale"]
	 * @param {Function} [options.onUpdate] - Callback on any signature change
	 */
	constructor({
		fileInput,
		previewContainer,
		previewImg,
		removeBtn,
		scaleSlider,
		scaleValueBadge,
		includeToggle = null,
		includeStatusBadge = null,
		btnInkBlue = null,
		btnInkOriginal = null,
		storageKey = "signature_webp",
		scaleStorageKey = "signature_scale",
		includeStorageKey = "signature_included",
		inkStorageKey = "signature_ink_mode",
		cssScaleVar = "--sig-scale",
		onUpdate = null,
	}) {
		this.#storageKey = storageKey;
		this.#rawStorageKey = storageKey + "_raw";
		this.#scaleStorageKey = scaleStorageKey;
		this.#includeStorageKey = includeStorageKey;
		this.#inkStorageKey = inkStorageKey;
		this.#cssScaleVar = cssScaleVar;
		this.#onUpdate = onUpdate;

		this.#dom = {
			fileInput,
			previewContainer,
			previewImg,
			removeBtn,
			scaleSlider,
			scaleValueBadge,
			includeToggle,
			includeStatusBadge,
			btnInkBlue,
			btnInkOriginal,
		};

		this.#signatureData = StorageService.get(this.#storageKey, null);
		this.#rawSignatureData = StorageService.get(this.#rawStorageKey, null);
		this.#scale = StorageService.get(this.#scaleStorageKey, 1.0);
		this.#isIncluded = StorageService.get(this.#includeStorageKey, true);
		this.#inkMode = StorageService.get(this.#inkStorageKey, "original");

		this.#init();
		this.#bindEvents();

		window.addEventListener("app:dataRestored", () => this.refreshFromStorage());
		window.addEventListener("app:dataCleared", () => this.remove());
	}

	get data() {
		return this.#signatureData;
	}

	get rawData() {
		return this.#rawSignatureData;
	}

	get scale() {
		return this.#scale;
	}

	get isIncluded() {
		return this.#isIncluded;
	}

	get inkMode() {
		return this.#inkMode;
	}

	#init() {
		this.#applyScale(this.#scale);
		this.#updateIncludeUI();
		this.#updateInkUI();

		if (this.#signatureData && this.#dom.previewImg && this.#dom.previewContainer) {
			this.#dom.previewImg.src = this.#signatureData;
			this.#dom.previewContainer.style.display = "block";
		}
	}

	#bindEvents() {
		// File upload
		if (this.#dom.fileInput) {
			this.#dom.fileInput.addEventListener("change", async (e) => {
				const file = e.target.files && e.target.files[0];
				if (file) {
					await this.#processFile(file);
				}
			});
		}

		// Remove button
		if (this.#dom.removeBtn) {
			this.#dom.removeBtn.addEventListener("click", () => {
				this.remove();
			});
		}

		// Scale slider
		if (this.#dom.scaleSlider) {
			this.#dom.scaleSlider.addEventListener("input", (e) => {
				const val = parseFloat(e.target.value);
				this.#applyScale(val);
				if (this.#onUpdate) {
					this.#onUpdate(this.#signatureData, this.#scale, this.#isIncluded);
				}
			});
		}

		// Inclusion toggle switch
		if (this.#dom.includeToggle) {
			this.#dom.includeToggle.addEventListener("change", (e) => {
				this.setIncluded(Boolean(e.target.checked));
			});
		}

		// Ink mode buttons
		if (this.#dom.btnInkBlue) {
			this.#dom.btnInkBlue.addEventListener("click", () => {
				this.setInkMode("blue");
			});
		}
		if (this.#dom.btnInkOriginal) {
			this.#dom.btnInkOriginal.addEventListener("click", () => {
				this.setInkMode("original");
			});
		}
	}

	async #processFile(file) {
		try {
			const { dataUrl, rawDataUrl } = await SignatureProcessor.process(file, { inkMode: this.#inkMode });
			this.#signatureData = dataUrl;
			this.#rawSignatureData = rawDataUrl;

			StorageService.set(this.#storageKey, dataUrl);
			StorageService.set(this.#rawStorageKey, rawDataUrl);

			// Automatically include newly uploaded signature
			this.#isIncluded = true;
			StorageService.set(this.#includeStorageKey, true);
			this.#updateIncludeUI();

			if (this.#dom.previewImg && this.#dom.previewContainer) {
				this.#dom.previewImg.src = dataUrl;
				this.#dom.previewContainer.style.display = "block";
			}

			if (this.#onUpdate) {
				this.#onUpdate(this.#signatureData, this.#scale, this.#isIncluded);
			}
		} catch (err) {
			console.error(`Signature processing error [${this.#storageKey}]:`, err);
		}
	}

	/**
	 * Switches ink color mode ("blue" or "original") and dynamically recolors.
	 * @param {"blue"|"original"} mode
	 */
	async setInkMode(mode) {
		if (mode !== "blue" && mode !== "original") return;
		this.#inkMode = mode;
		StorageService.set(this.#inkStorageKey, mode);
		this.#updateInkUI();

		// If we have raw signature data, recolor instantly
		const source = this.#rawSignatureData || this.#signatureData;
		if (source) {
			try {
				const { dataUrl } = await SignatureProcessor.process(source, { inkMode: mode });
				this.#signatureData = dataUrl;
				StorageService.set(this.#storageKey, dataUrl);

				if (this.#dom.previewImg) {
					this.#dom.previewImg.src = dataUrl;
				}

				if (this.#onUpdate) {
					this.#onUpdate(this.#signatureData, this.#scale, this.#isIncluded);
				}
			} catch (err) {
				console.error(`Error re-coloring signature to ${mode}:`, err);
			}
		}
	}

	/**
	 * Toggles whether digital signature is included in document sheet or left blank for pen sign.
	 * @param {boolean} included
	 */
	setIncluded(included) {
		this.#isIncluded = Boolean(included);
		StorageService.set(this.#includeStorageKey, this.#isIncluded);
		this.#updateIncludeUI();

		if (this.#onUpdate) {
			this.#onUpdate(this.#signatureData, this.#scale, this.#isIncluded);
		}
	}

	#updateIncludeUI() {
		if (this.#dom.includeToggle) {
			this.#dom.includeToggle.checked = this.#isIncluded;
		}
		if (this.#dom.includeStatusBadge) {
			const isHi = I18nService.locale === "hi";
			if (this.#isIncluded) {
				this.#dom.includeStatusBadge.textContent = isHi ? "प्रिंट में शामिल" : "Included on Sheet";
				this.#dom.includeStatusBadge.classList.add("is-included");
				this.#dom.includeStatusBadge.classList.remove("is-excluded");
			} else {
				this.#dom.includeStatusBadge.textContent = isHi ? "खाली (हाथ से साइन)" : "Blank (Sign with Pen)";
				this.#dom.includeStatusBadge.classList.add("is-excluded");
				this.#dom.includeStatusBadge.classList.remove("is-included");
			}
		}
	}

	#updateInkUI() {
		if (this.#dom.btnInkBlue) {
			this.#dom.btnInkBlue.classList.toggle("active", this.#inkMode === "blue");
			this.#dom.btnInkBlue.setAttribute("aria-pressed", String(this.#inkMode === "blue"));
		}
		if (this.#dom.btnInkOriginal) {
			this.#dom.btnInkOriginal.classList.toggle("active", this.#inkMode === "original");
			this.#dom.btnInkOriginal.setAttribute("aria-pressed", String(this.#inkMode === "original"));
		}
	}

	refreshFromStorage() {
		this.#signatureData = StorageService.get(this.#storageKey, null);
		this.#rawSignatureData = StorageService.get(this.#rawStorageKey, null);
		this.#scale = StorageService.get(this.#scaleStorageKey, 1.0);
		this.#isIncluded = StorageService.get(this.#includeStorageKey, true);
		this.#inkMode = StorageService.get(this.#inkStorageKey, "original");

		this.#applyScale(this.#scale);
		this.#updateIncludeUI();
		this.#updateInkUI();

		if (this.#signatureData && this.#dom.previewImg && this.#dom.previewContainer) {
			this.#dom.previewImg.src = this.#signatureData;
			this.#dom.previewContainer.style.display = "block";
		} else {
			if (this.#dom.previewContainer) this.#dom.previewContainer.style.display = "none";
			if (this.#dom.previewImg) this.#dom.previewImg.src = "";
			if (this.#dom.fileInput) this.#dom.fileInput.value = "";
		}

		if (this.#onUpdate) {
			this.#onUpdate(this.#signatureData, this.#scale, this.#isIncluded);
		}
	}

	remove() {
		this.#signatureData = null;
		this.#rawSignatureData = null;
		StorageService.remove(this.#storageKey);
		StorageService.remove(this.#rawStorageKey);

		if (this.#dom.fileInput) {
			this.#dom.fileInput.value = "";
		}
		if (this.#dom.previewContainer) {
			this.#dom.previewContainer.style.display = "none";
		}
		if (this.#dom.previewImg) {
			this.#dom.previewImg.src = "";
		}

		if (this.#onUpdate) {
			this.#onUpdate(null, this.#scale, this.#isIncluded);
		}
	}

	#applyScale(scale) {
		this.#scale = scale;
		StorageService.set(this.#scaleStorageKey, scale);
		if (this.#cssScaleVar) {
			document.documentElement.style.setProperty(this.#cssScaleVar, String(scale));
		}
		if (this.#dom.scaleValueBadge) {
			this.#dom.scaleValueBadge.textContent = `${scale.toFixed(2)}× (${Math.round(scale * 100)}%)`;
		}
		if (this.#dom.scaleSlider) {
			this.#dom.scaleSlider.value = String(scale);
		}
	}
}

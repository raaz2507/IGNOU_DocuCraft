/**
 * SignatureUploaderController
 * Single Responsibility: Manages digital signature image uploads, background removal
 * transparent WebP processing, real-time preview, scale slider control, and localStorage caching.
 * Reusable across any signature field (Student Signature, Guide Signature, etc.).
 */
import { StorageService } from "./storage.service.js";
import { SignatureProcessor } from "./signature.processor.js";

export class SignatureUploaderController {
	#storageKey;
	#scaleStorageKey;
	#cssScaleVar;
	#signatureData = null;
	#scale = 1.0;
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
	 * @param {string} options.storageKey - Key in StorageService for the WebP string
	 * @param {string} options.scaleStorageKey - Key in StorageService for scale float
	 * @param {string} options.cssScaleVar - CSS custom property name (e.g. --sig-scale)
	 * @param {Function} options.onUpdate - Callback invoked on signature upload, deletion, or scale change
	 */
	constructor({
		fileInput,
		previewContainer,
		previewImg,
		removeBtn,
		scaleSlider,
		scaleValueBadge,
		storageKey = "signature_webp",
		scaleStorageKey = "signature_scale",
		cssScaleVar = "--sig-scale",
		onUpdate = null,
	}) {
		this.#storageKey = storageKey;
		this.#scaleStorageKey = scaleStorageKey;
		this.#cssScaleVar = cssScaleVar;
		this.#onUpdate = onUpdate;

		this.#dom = {
			fileInput,
			previewContainer,
			previewImg,
			removeBtn,
			scaleSlider,
			scaleValueBadge,
		};

		this.#signatureData = StorageService.get(this.#storageKey, null);
		this.#scale = StorageService.get(this.#scaleStorageKey, 1.0);

		this.#init();
		this.#bindEvents();

		window.addEventListener("app:dataRestored", () => this.refreshFromStorage());
		window.addEventListener("app:dataCleared", () => this.remove());
	}

	refreshFromStorage() {
		this.#signatureData = StorageService.get(this.#storageKey, null);
		this.#scale = StorageService.get(this.#scaleStorageKey, 1.0);
		this.#applyScale(this.#scale);

		if (this.#signatureData && this.#dom.previewImg && this.#dom.previewContainer) {
			this.#dom.previewImg.src = this.#signatureData;
			this.#dom.previewContainer.style.display = "block";
		} else {
			if (this.#dom.previewContainer) this.#dom.previewContainer.style.display = "none";
			if (this.#dom.previewImg) this.#dom.previewImg.src = "";
			if (this.#dom.fileInput) this.#dom.fileInput.value = "";
		}

		if (this.#onUpdate) {
			this.#onUpdate(this.#signatureData, this.#scale);
		}
	}

	get data() {
		return this.#signatureData;
	}

	get scale() {
		return this.#scale;
	}

	#init() {
		this.#applyScale(this.#scale);
		if (this.#signatureData && this.#dom.previewImg && this.#dom.previewContainer) {
			this.#dom.previewImg.src = this.#signatureData;
			this.#dom.previewContainer.style.display = "block";
		}
	}

	#bindEvents() {
		if (this.#dom.fileInput) {
			this.#dom.fileInput.addEventListener("change", async (e) => {
				const file = e.target.files && e.target.files[0];
				if (file) {
					await this.#processFile(file);
				}
			});
		}

		if (this.#dom.removeBtn) {
			this.#dom.removeBtn.addEventListener("click", () => {
				this.remove();
			});
		}

		if (this.#dom.scaleSlider) {
			this.#dom.scaleSlider.addEventListener("input", (e) => {
				const val = parseFloat(e.target.value);
				this.#applyScale(val);
				if (this.#onUpdate) {
					this.#onUpdate(this.#signatureData, this.#scale);
				}
			});
		}
	}

	async #processFile(file) {
		try {
			const webpData = await SignatureProcessor.process(file);
			this.#signatureData = webpData;
			StorageService.set(this.#storageKey, webpData);

			if (this.#dom.previewImg && this.#dom.previewContainer) {
				this.#dom.previewImg.src = webpData;
				this.#dom.previewContainer.style.display = "block";
			}

			if (this.#onUpdate) {
				this.#onUpdate(this.#signatureData, this.#scale);
			}
		} catch (err) {
			console.error(`Signature processing error [${this.#storageKey}]:`, err);
		}
	}

	remove() {
		this.#signatureData = null;
		StorageService.remove(this.#storageKey);

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
			this.#onUpdate(null, this.#scale);
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

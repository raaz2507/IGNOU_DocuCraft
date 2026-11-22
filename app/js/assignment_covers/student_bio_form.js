/**
 * StudentBioForm
 * Manages student bio credentials, signature processing, and live handwriting ink synchronization.
 * Single Responsibility: Form input binding, localStorage persistence, sample guide injection, and signature lifecycle.
 */
import { StorageService } from "../shared/storage.service.js";
import { I18nService } from "../shared/i18n.service.js";
import { SignatureProcessor } from "../shared/signature.processor.js";

export class StudentBioForm {
	#persistentFields = [
		"Enrolment",
		"Name",
		"Address1",
		"Address2",
		"ProgrammeCode",
		"Programme",
		"StudyCentreCode",
		"StudyCentreName",
		"StudyCentreAddress1",
		"StudyCentreAddress2",
		"Phone",
		"Email",
		"Date",
	];
	#isSampleGhostActive = false;
	#signatureData = null;
	#signatureScale = 1.0;
	#dom = {};
	#onFormChangeCallback = null;

	constructor({ onFormChange } = {}) {
		this.#onFormChangeCallback = onFormChange || null;
		this.#isSampleGhostActive = StorageService.get("isSampleGhostActive", false);
		this.#signatureData = StorageService.get("signature_webp", null);
		this.#signatureScale = StorageService.get("signature_scale", 1.0);

		this.#initDOM();
		this.#bindEvents();
		this.restoreProfileData();
		this.initSignatureState();
		this.injectSamplePlaceholders();
		this.updateSampleToggleButtonUI();
	}

	get signatureData() {
		return this.#signatureData;
	}

	get signatureScale() {
		return this.#signatureScale;
	}

	get isSampleGhostActive() {
		return this.#isSampleGhostActive;
	}

	#initDOM() {
		this.#dom = {
			btnToggleSample: document.getElementById("btnToggleSample"),
			btnClear: document.getElementById("btnClear"),
			btnTodayDate: document.getElementById("btnTodayDate"),
			sigFileInput: document.getElementById("sigFileInput"),
			sigPreviewContainer: document.getElementById("sigPreviewContainer"),
			sigPreviewImg: document.getElementById("sigPreviewImg"),
			btnRemoveSig: document.getElementById("btnRemoveSig"),
			sigScaleSlider: document.getElementById("sigScaleSlider"),
			sigScaleValue: document.getElementById("sigScaleValue"),
		};
	}

	#bindEvents() {
		// Field Input Event Listeners
		this.#persistentFields.forEach((fieldName) => {
			const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
			if (input) {
				input.addEventListener("input", (e) => {
					this.#syncField(fieldName, e.target.value);
					if (this.#onFormChangeCallback) this.#onFormChangeCallback(fieldName, e.target.value);
				});
			}
		});

		// Quick "Today" Date Shortcut
		if (this.#dom.btnTodayDate) {
			this.#dom.btnTodayDate.addEventListener("click", () => {
				const now = new Date();
				const formatted = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
				const dateInput = document.getElementById("inputDate");
				if (dateInput) {
					dateInput.value = formatted;
					this.#syncField("Date", formatted);
					if (this.#onFormChangeCallback) this.#onFormChangeCallback("Date", formatted);
				}
			});
		}

		// Sample Guide Toggle
		if (this.#dom.btnToggleSample) {
			this.#dom.btnToggleSample.addEventListener("click", () => this.toggleSampleData());
		}

		// Clear All Fields
		if (this.#dom.btnClear) {
			this.#dom.btnClear.addEventListener("click", () => this.clearAllData());
		}

		// Signature File Upload
		if (this.#dom.sigFileInput) {
			this.#dom.sigFileInput.addEventListener("change", (e) => {
				const file = e.target.files && e.target.files[0];
				if (file) this.#processSignatureImage(file);
			});
		}

		// Remove Signature
		if (this.#dom.btnRemoveSig) {
			this.#dom.btnRemoveSig.addEventListener("click", () => this.#removeSignature());
		}

		// Signature Scale Multiplier Slider
		if (this.#dom.sigScaleSlider) {
			this.#dom.sigScaleSlider.addEventListener("input", (e) => {
				this.setSignatureScale(e.target.value);
			});
		}

		// Global Data Restored and Cleared Event Listeners
		window.addEventListener("app:dataRestored", () => {
			this.restoreProfileData();
			this.initSignatureState();
			this.syncDOMValues();
		});

		window.addEventListener("app:dataCleared", () => {
			this.#persistentFields.forEach((fieldName) => {
				const input = document.getElementById("input" + fieldName);
				if (input) input.value = "";
			});
			this.#removeSignature();
			this.syncDOMValues();
		});
	}

	injectSamplePlaceholders() {
		const profile = I18nService.getSampleProfile();
		Object.entries(profile).forEach(([fieldName, config]) => {
			const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
			if (input && config.placeholder) {
				input.setAttribute("placeholder", config.placeholder);
			}
		});
	}

	#syncField(fieldName, userVal) {
		const trimmed = (userVal || "").trim();
		const isGhost = trimmed === "" && this.#isSampleGhostActive;
		const profile = I18nService.getSampleProfile();
		const displayVal = trimmed !== "" ? userVal : (isGhost ? profile[fieldName]?.value || "" : "");

		document.querySelectorAll(".val-" + fieldName).forEach((el) => {
			el.textContent = displayVal;
			el.classList.toggle("is-ghost-sample", isGhost);
		});
		StorageService.set("field_" + fieldName, userVal);
	}

	syncDOMValues() {
		const profile = I18nService.getSampleProfile();
		this.#persistentFields.forEach((fieldName) => {
			const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
			const userVal = input ? input.value : "";
			const trimmed = userVal.trim();
			const isGhost = trimmed === "" && this.#isSampleGhostActive;
			const displayVal = trimmed !== "" ? userVal : (isGhost ? profile[fieldName]?.value || "" : "");

			document.querySelectorAll(".val-" + fieldName).forEach((el) => {
				el.textContent = displayVal;
				el.classList.toggle("is-ghost-sample", isGhost);
			});
		});
	}

	restoreProfileData() {
		// Backward-compatibility migrations
		if (StorageService.get("field_ProgrammeCode", null) === null) {
			const savedProg = StorageService.get("field_Programme", "");
			if (savedProg && savedProg.includes("MCA_NEW")) {
				StorageService.set("field_ProgrammeCode", "MCA_NEW");
				StorageService.set("field_Programme", "Master of Computer Applications");
			}
		}
		if (StorageService.get("field_StudyCentreCode", null) === null) {
			const sc1 = StorageService.get("field_StudyCentre1", null);
			const sc2 = StorageService.get("field_StudyCentre2", null);
			if (sc1) StorageService.set("field_StudyCentreCode", sc1);
			if (sc2) StorageService.set("field_StudyCentreName", sc2);
		}
		if (StorageService.get("field_StudyCentreAddress1", null) === null) {
			const oldAddr = StorageService.get("field_StudyCentreAddress", null);
			if (oldAddr) StorageService.set("field_StudyCentreAddress1", oldAddr);
		}

		this.#persistentFields.forEach((fieldName) => {
			const saved = StorageService.get("field_" + fieldName, null);
			const input = document.getElementById("input" + fieldName);
			if (saved !== null && input) {
				input.value = saved;
			}
		});
	}

	toggleSampleData() {
		this.#isSampleGhostActive = !this.#isSampleGhostActive;
		StorageService.set("isSampleGhostActive", this.#isSampleGhostActive);
		this.updateSampleToggleButtonUI();
		this.syncDOMValues();
	}

	updateSampleToggleButtonUI() {
		if (!this.#dom.btnToggleSample) return;
		this.#dom.btnToggleSample.classList.toggle("active", this.#isSampleGhostActive);
		this.#dom.btnToggleSample.setAttribute("aria-pressed", String(this.#isSampleGhostActive));
	}

	clearAllData() {
		if (!confirm("Are you sure you want to clear all student profile details?")) return;

		this.#persistentFields.forEach((fieldName) => {
			StorageService.remove("field_" + fieldName);
			const input = document.getElementById("input" + fieldName);
			if (input) input.value = "";
		});

		this.#removeSignature();
		this.syncDOMValues();
	}

	initSignatureState() {
		this.setSignatureScale(this.#signatureScale);
		if (this.#signatureData && this.#dom.sigPreviewImg && this.#dom.sigPreviewContainer) {
			this.#dom.sigPreviewImg.src = this.#signatureData;
			this.#dom.sigPreviewContainer.classList.add("visible");
		}
	}

	async #processSignatureImage(file) {
		if (!file) return;
		try {
			const webpResult = await SignatureProcessor.process(file);
			this.#signatureData = webpResult;
			StorageService.set("signature_webp", webpResult);
			if (this.#dom.sigPreviewImg) this.#dom.sigPreviewImg.src = webpResult;
			if (this.#dom.sigPreviewContainer) this.#dom.sigPreviewContainer.classList.add("visible");
			if (this.#onFormChangeCallback) this.#onFormChangeCallback("signature", webpResult);
		} catch (err) {
			console.error("Signature processing error:", err);
		}
	}

	#removeSignature() {
		this.#signatureData = null;
		StorageService.remove("signature_webp");
		if (this.#dom.sigFileInput) this.#dom.sigFileInput.value = "";
		if (this.#dom.sigPreviewImg) this.#dom.sigPreviewImg.src = "";
		if (this.#dom.sigPreviewContainer) this.#dom.sigPreviewContainer.classList.remove("visible");
		if (this.#onFormChangeCallback) this.#onFormChangeCallback("signature", null);
	}

	setSignatureScale(scale) {
		this.#signatureScale = parseFloat(scale) || 1.0;
		StorageService.set("signature_scale", this.#signatureScale);
		document.documentElement.style.setProperty("--sig-scale", this.#signatureScale.toFixed(2));
		if (this.#dom.sigScaleValue) {
			this.#dom.sigScaleValue.textContent = `${this.#signatureScale.toFixed(2)}× (${Math.round(this.#signatureScale * 100)}%)`;
		}
		if (this.#dom.sigScaleSlider) {
			this.#dom.sigScaleSlider.value = this.#signatureScale;
		}
	}
}

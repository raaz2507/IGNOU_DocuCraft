/**
 * StudentBioForm
 * Manages student bio credentials, signature processing, and live handwriting ink synchronization.
 * Single Responsibility: Form input binding, localStorage persistence, sample guide injection, and signature lifecycle.
 */
import { StorageService } from "../shared/storage.service.js";
import { I18nService } from "../shared/i18n.service.js";
import { SignatureUploaderController } from "../shared/signature_uploader_controller.js";
import { DataManagerService } from "../shared/data_manager.service.js";
import { DateUtils } from "../shared/date_utils.js";

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
	#dom = {};
	#onFormChangeCallback = null;
	sigCtrl = null;

	constructor({ onFormChange } = {}) {
		this.#onFormChangeCallback = onFormChange || null;
		this.#isSampleGhostActive = StorageService.get("isSampleGhostActive", false);

		this.#initDOM();
		this.#initSignatureController();
		this.#bindEvents();
		this.restoreProfileData();
		this.injectSamplePlaceholders();
		this.updateSampleToggleButtonUI();
	}

	get signatureData() {
		return this.sigCtrl?.data ?? null;
	}

	get signatureScale() {
		return this.sigCtrl?.scale ?? 1.0;
	}

	get isSignatureIncluded() {
		return this.sigCtrl?.isIncluded ?? true;
	}

	get isSampleGhostActive() {
		return this.#isSampleGhostActive;
	}

	#initSignatureController() {
		this.sigCtrl = new SignatureUploaderController({
			fileInput: this.#dom.sigFileInput,
			previewContainer: this.#dom.sigPreviewContainer,
			previewImg: this.#dom.sigPreviewImg,
			removeBtn: this.#dom.btnRemoveSig,
			scaleSlider: this.#dom.sigScaleSlider,
			scaleValueBadge: this.#dom.sigScaleValue,
			includeToggle: this.#dom.sigIncludeToggle,
			includeStatusBadge: this.#dom.sigStatusBadge,
			btnInkBlue: this.#dom.btnSigInkBlue,
			btnInkOriginal: this.#dom.btnSigInkOriginal,
			storageKey: "signature_webp",
			scaleStorageKey: "signature_scale",
			includeStorageKey: "signature_included",
			inkStorageKey: "signature_ink_mode",
			cssScaleVar: "--sig-scale",
			onUpdate: (data, scale, isIncluded) => {
				if (this.#onFormChangeCallback) this.#onFormChangeCallback("signature", data);
			},
		});
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
			sigIncludeToggle: document.getElementById("sigIncludeCheckbox"),
			sigStatusBadge: document.getElementById("sigStatusBadge"),
			btnSigInkBlue: document.getElementById("btnSigInkBlue"),
			btnSigInkOriginal: document.getElementById("btnSigInkOriginal"),
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
				const formatted = DateUtils.getTodayFormatted();
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

		// Global Data Restored and Cleared Event Listeners
		window.addEventListener("app:dataRestored", () => {
			this.restoreProfileData();
			this.syncDOMValues();
		});

		window.addEventListener("app:dataCleared", () => {
			this.#isSampleGhostActive = false;
			StorageService.set("isSampleGhostActive", false);
			this.updateSampleToggleButtonUI();
			this.#persistentFields.forEach((fieldName) => {
				const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
				if (input) input.value = "";
			});
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
		const confirmMsg = I18nService.t("dataModal.confirmReset");
		if (!confirm(confirmMsg)) return;
		DataManagerService.clearAllData();
	}
}

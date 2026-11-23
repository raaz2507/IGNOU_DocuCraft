/**
 * ProjectForm Component
 * Single Responsibility: Manages Project Particulars, Guide Credentials, Sample Guide toggling, and Shared Student Profile syncing.
 * Automatically synchronizes with shared profile credentials and sample guide data from StorageService (100% DRY).
 */
import { StorageService } from "../shared/storage.service.js";
import { I18nService } from "../shared/i18n.service.js";
import { SignatureUploaderController } from "../shared/signature_uploader_controller.js";
import { DataManagerService } from "../shared/data_manager.service.js";
import { DateUtils } from "../shared/date_utils.js";

export class ProjectForm {
	#projectFields = [
		// Shared Student Credentials (Auto-persisted across tools)
		"Enrolment",
		"Name",
		"Address1",
		"Address2",
		"Phone",
		"Email",
		"StudyCentreCode",
		"StudyCentreName",
		"RegionalCentre",
		"RegionalCentreCode",

		// Project & Guide Particulars
		"ProjectTitle",
		"SubjectArea",
		"GuideName",
		"GuideDesignation",
		"GuideAddress",
		"GuideAddress1",
		"GuideAddress2",
		"GuideQualification",
		"GuideDegree",
		"GuideExperience",
		"ProjectSoftware",
		"FirstSubmission",
		"SubmissionDate",
		"GuideDate",
	];

	#isSampleGhostActive = false;
	#dom = {};
	#onChangeCallback = null;
	studentSigCtrl = null;
	guideSigCtrl = null;

	constructor({ onChange } = {}) {
		this.#onChangeCallback = onChange || null;
		this.#isSampleGhostActive = StorageService.get("isSampleGhostActive", false);

		this.#initDOM();
		this.#initSignatureControllers();
		this.#restoreData();
		this.#bindEvents();
		this.injectSamplePlaceholders();
		this.updateSampleToggleButtonUI();
		this.syncAllFields();
	}

	get signatureData() {
		return this.studentSigCtrl?.data ?? null;
	}

	get signatureScale() {
		return this.studentSigCtrl?.scale ?? 1.0;
	}

	get isSignatureIncluded() {
		return this.studentSigCtrl?.isIncluded ?? true;
	}

	get guideSignatureData() {
		return this.guideSigCtrl?.data ?? null;
	}

	get guideSignatureScale() {
		return this.guideSigCtrl?.scale ?? 1.0;
	}

	get isGuideSignatureIncluded() {
		return this.guideSigCtrl?.isIncluded ?? true;
	}

	get isSampleGhostActive() {
		return this.#isSampleGhostActive;
	}

	#initDOM() {
		this.#dom = {
			btnToggleSample: document.getElementById("btnToggleSample"),
			btnTodayDate: document.getElementById("btnTodayDate"),
			btnCalSubmissionDate: document.getElementById("btnCalSubmissionDate"),
			pickerSubmissionDate: document.getElementById("pickerSubmissionDate"),
			btnTodayGuideDate: document.getElementById("btnTodayGuideDate"),
			btnCalGuideDate: document.getElementById("btnCalGuideDate"),
			pickerGuideDate: document.getElementById("pickerGuideDate"),
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

			guideSigFileInput: document.getElementById("guideSigFileInput"),
			guideSigPreviewContainer: document.getElementById("guideSigPreviewContainer"),
			guideSigPreviewImg: document.getElementById("guideSigPreviewImg"),
			btnRemoveGuideSig: document.getElementById("btnRemoveGuideSig"),
			guideSigScaleSlider: document.getElementById("guideSigScaleSlider"),
			guideSigScaleValue: document.getElementById("guideSigScaleValue"),
			guideSigIncludeToggle: document.getElementById("guideSigIncludeCheckbox"),
			guideSigStatusBadge: document.getElementById("guideSigStatusBadge"),
			btnGuideSigInkBlue: document.getElementById("btnGuideSigInkBlue"),
			btnGuideSigInkOriginal: document.getElementById("btnGuideSigInkOriginal"),
		};
	}

	#initSignatureControllers() {
		// Reusable Student Signature Controller (DRY)
		this.studentSigCtrl = new SignatureUploaderController({
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
				if (this.#onChangeCallback) this.#onChangeCallback("Signature", data);
			},
		});

		// Reusable Guide Signature Controller (DRY)
		this.guideSigCtrl = new SignatureUploaderController({
			fileInput: this.#dom.guideSigFileInput,
			previewContainer: this.#dom.guideSigPreviewContainer,
			previewImg: this.#dom.guideSigPreviewImg,
			removeBtn: this.#dom.btnRemoveGuideSig,
			scaleSlider: this.#dom.guideSigScaleSlider,
			scaleValueBadge: this.#dom.guideSigScaleValue,
			includeToggle: this.#dom.guideSigIncludeToggle,
			includeStatusBadge: this.#dom.guideSigStatusBadge,
			btnInkBlue: this.#dom.btnGuideSigInkBlue,
			btnInkOriginal: this.#dom.btnGuideSigInkOriginal,
			storageKey: "guide_signature_webp",
			scaleStorageKey: "guide_signature_scale",
			includeStorageKey: "guide_signature_included",
			inkStorageKey: "guide_signature_ink_mode",
			cssScaleVar: "--guide-sig-scale",
			onUpdate: (data, scale, isIncluded) => {
				if (this.#onChangeCallback) this.#onChangeCallback("GuideSignature", data);
			},
		});
	}

	#restoreData() {
		// Restore all fields from StorageService
		this.#projectFields.forEach((fieldName) => {
			if (fieldName === "GuideDegree" || fieldName === "FirstSubmission") return;
			const saved = StorageService.get("field_" + fieldName, null);
			const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
			if (input && saved !== null) {
				input.value = saved;
			}
		});

		// Restore Degree Checkboxes (Array)
		const savedDegree = StorageService.get("field_GuideDegree", ["phd"]);
		const degreeArray = Array.isArray(savedDegree) ? savedDegree : [savedDegree];
		document.querySelectorAll('input[name="GuideDegree"]').forEach((cb) => {
			cb.checked = degreeArray.includes(cb.value);
		});

		// Restore First Submission Radio
		const savedFirst = StorageService.get("field_FirstSubmission", null);
		if (savedFirst) {
			const radio = document.querySelector(`input[name="FirstSubmission"][value="${savedFirst}"]`);
			if (radio) radio.checked = true;
		}

		// Auto default Year if empty
		const yearInput = document.getElementById("inputSubmissionYear");
		if (yearInput && !yearInput.value) {
			const currentYear = String(new Date().getFullYear());
			yearInput.value = currentYear;
			StorageService.set("field_SubmissionYear", currentYear);
		}
	}

	#bindEvents() {
		// Generic input change listeners for all inputs with data-field
		document.querySelectorAll(".control-panel [data-field]").forEach((input) => {
			const fieldName = input.getAttribute("data-field");
			const eventType = input.tagName === "SELECT" ? "change" : "input";

			input.addEventListener(eventType, (e) => {
				const val = e.target.value;
				StorageService.set("field_" + fieldName, val);
				this.#syncToDOM(fieldName, val);
				if (this.#onChangeCallback) this.#onChangeCallback(fieldName, val);
			});
		});

		// Multi-select Guide Degree Checkboxes
		document.querySelectorAll('input[name="GuideDegree"]').forEach((cb) => {
			cb.addEventListener("change", () => {
				const checkedVals = Array.from(document.querySelectorAll('input[name="GuideDegree"]:checked')).map((el) => el.value);
				StorageService.set("field_GuideDegree", checkedVals);
				this.#syncDegreeToDOM(checkedVals);
				if (this.#onChangeCallback) this.#onChangeCallback("GuideDegree", checkedVals);
			});
		});

		// First Submission Radio Buttons
		document.querySelectorAll('input[name="FirstSubmission"]').forEach((radio) => {
			radio.addEventListener("change", (e) => {
				if (e.target.checked) {
					const val = e.target.value;
					StorageService.set("field_FirstSubmission", val);
					this.#syncFirstSubmissionToDOM(val);
					if (this.#onChangeCallback) this.#onChangeCallback("FirstSubmission", val);
				}
			});
		});

		// Section VIII Tech Stack Quick Chips (Interactive 2-Way Checkbox Toggle)
		this.#initTechChips();

		// Section VIII Guidelines Card Toggle
		const btnToggleGuide = document.getElementById("btnToggleSection8Guide");
		const guideCard = document.getElementById("section8GuideCard");
		const btnCloseGuide = document.getElementById("btnCloseSection8Guide");

		if (btnToggleGuide && guideCard) {
			btnToggleGuide.addEventListener("click", () => {
				const isVisible = guideCard.style.display !== "none";
				guideCard.style.display = isVisible ? "none" : "block";
			});
		}

		if (btnCloseGuide && guideCard) {
			btnCloseGuide.addEventListener("click", () => {
				guideCard.style.display = "none";
			});
		}

		// Sample Guide Toggle
		if (this.#dom.btnToggleSample) {
			this.#dom.btnToggleSample.addEventListener("click", () => this.toggleSampleData());
		}

		// Quick "Today" shortcut for SubmissionDate
		if (this.#dom.btnTodayDate) {
			this.#dom.btnTodayDate.addEventListener("click", () => {
				const formatted = DateUtils.getTodayFormatted();
				const dateInput = document.getElementById("inputSubmissionDate");
				if (dateInput) {
					dateInput.value = formatted;
					StorageService.set("field_SubmissionDate", formatted);
					this.#syncToDOM("SubmissionDate", formatted);
					if (this.#onChangeCallback) this.#onChangeCallback("SubmissionDate", formatted);
				}
			});
		}

		// Calendar Trigger for SubmissionDate
		if (this.#dom.btnCalSubmissionDate && this.#dom.pickerSubmissionDate) {
			this.#dom.btnCalSubmissionDate.addEventListener("click", () => {
				try {
					if (typeof this.#dom.pickerSubmissionDate.showPicker === "function") {
						this.#dom.pickerSubmissionDate.showPicker();
					} else {
						this.#dom.pickerSubmissionDate.focus();
					}
				} catch {
					this.#dom.pickerSubmissionDate.focus();
				}
			});
		}

		// Calendar Date Picker for SubmissionDate
		if (this.#dom.pickerSubmissionDate) {
			this.#dom.pickerSubmissionDate.addEventListener("change", (e) => {
				const formatted = DateUtils.formatISODate(e.target.value);
				if (!formatted) return;
				const dateInput = document.getElementById("inputSubmissionDate");
				if (dateInput) {
					dateInput.value = formatted;
					StorageService.set("field_SubmissionDate", formatted);
					this.#syncToDOM("SubmissionDate", formatted);
					if (this.#onChangeCallback) this.#onChangeCallback("SubmissionDate", formatted);
				}
			});
		}

		// Quick "Today" shortcut for GuideDate
		if (this.#dom.btnTodayGuideDate) {
			this.#dom.btnTodayGuideDate.addEventListener("click", () => {
				const formatted = DateUtils.getTodayFormatted();
				const dateInput = document.getElementById("inputGuideDate");
				if (dateInput) {
					dateInput.value = formatted;
					StorageService.set("field_GuideDate", formatted);
					this.#syncToDOM("GuideDate", formatted);
					if (this.#onChangeCallback) this.#onChangeCallback("GuideDate", formatted);
				}
			});
		}

		// Calendar Trigger for GuideDate
		if (this.#dom.btnCalGuideDate && this.#dom.pickerGuideDate) {
			this.#dom.btnCalGuideDate.addEventListener("click", () => {
				try {
					if (typeof this.#dom.pickerGuideDate.showPicker === "function") {
						this.#dom.pickerGuideDate.showPicker();
					} else {
						this.#dom.pickerGuideDate.focus();
					}
				} catch {
					this.#dom.pickerGuideDate.focus();
				}
			});
		}

		// Calendar Date Picker for GuideDate
		if (this.#dom.pickerGuideDate) {
			this.#dom.pickerGuideDate.addEventListener("change", (e) => {
				const formatted = DateUtils.formatISODate(e.target.value);
				if (!formatted) return;
				const dateInput = document.getElementById("inputGuideDate");
				if (dateInput) {
					dateInput.value = formatted;
					StorageService.set("field_GuideDate", formatted);
					this.#syncToDOM("GuideDate", formatted);
					if (this.#onChangeCallback) this.#onChangeCallback("GuideDate", formatted);
				}
			});
		}

		// Global Data Restored and Cleared Event Listeners
		window.addEventListener("app:dataRestored", () => {
			this.#restoreData();
			this.syncAllFields();
		});

		window.addEventListener("app:dataCleared", () => {
			this.clearAll();
		});
	}

	injectSamplePlaceholders() {
		const profile = I18nService.getSampleProfile();
		this.#projectFields.forEach((fieldName) => {
			const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
			if (input && profile[fieldName]?.placeholder) {
				input.setAttribute("placeholder", profile[fieldName].placeholder);
			}
		});
	}

	toggleSampleData() {
		this.#isSampleGhostActive = !this.#isSampleGhostActive;
		StorageService.set("isSampleGhostActive", this.#isSampleGhostActive);
		this.updateSampleToggleButtonUI();
		this.syncAllFields();
	}

	clearAllData() {
		const confirmMsg = I18nService.t("dataModal.confirmReset");
		if (window.confirm(confirmMsg)) {
			DataManagerService.clearAllData();
		}
	}

	clearAll() {
		this.#isSampleGhostActive = false;
		StorageService.set("isSampleGhostActive", false);
		this.updateSampleToggleButtonUI();

		this.#projectFields.forEach((fieldName) => {
			const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
			if (input) input.value = "";
		});

		// Clear checkboxes and radio
		document.querySelectorAll('input[name="GuideDegree"]').forEach((cb) => (cb.checked = false));
		const firstYes = document.querySelector('input[name="FirstSubmission"][value="yes"]');
		if (firstYes) firstYes.checked = true;

		// Clear Tech Stack Chips
		this.#updateTechChipsUI("");

		// Remove signatures
		this.studentSigCtrl?.remove();
		this.guideSigCtrl?.remove();

		this.syncAllFields();
	}

	updateSampleToggleButtonUI() {
		if (!this.#dom.btnToggleSample) return;
		this.#dom.btnToggleSample.classList.toggle("active", this.#isSampleGhostActive);
		this.#dom.btnToggleSample.setAttribute("aria-pressed", String(this.#isSampleGhostActive));
	}

	#syncDegreeToDOM(degreeVals) {
		const activeSet = new Set(Array.isArray(degreeVals) ? degreeVals : (degreeVals ? [degreeVals] : []));
		const degrees = ["phd", "mtech", "be_btech", "mca", "msc"];
		degrees.forEach((deg) => {
			document.querySelectorAll(`.check-degree-${deg}`).forEach((el) => {
				const isChecked = activeSet.has(deg);
				el.textContent = isChecked ? "✓" : "";
				el.classList.toggle("is-ghost-sample", this.#isSampleGhostActive);
			});
		});
	}

	#syncFirstSubmissionToDOM(firstVal) {
		const targetVal = (firstVal || "yes").toLowerCase();
		document.querySelectorAll(".check-first-yes").forEach((el) => {
			el.textContent = targetVal === "yes" ? "✓" : "";
			el.classList.toggle("is-ghost-sample", this.#isSampleGhostActive);
		});
		document.querySelectorAll(".check-first-no").forEach((el) => {
			el.textContent = targetVal === "no" ? "✓" : "";
			el.classList.toggle("is-ghost-sample", this.#isSampleGhostActive);
		});
	}

	#syncToDOM(fieldName, userVal) {
		if (fieldName === "GuideDegree") {
			this.#syncDegreeToDOM(userVal);
			return;
		}
		if (fieldName === "FirstSubmission") {
			this.#syncFirstSubmissionToDOM(userVal);
			return;
		}
		if (fieldName === "SubmissionDate") {
			this.#syncSubmissionYear(userVal);
		}
		if (fieldName === "ProjectSoftware") {
			this.#syncProjectSoftware(userVal);
		}
		const trimmed = (userVal || "").trim();
		const isGhost = trimmed === "" && this.#isSampleGhostActive;
		const profile = I18nService.getSampleProfile();
		let displayVal = trimmed !== "" ? userVal : (isGhost ? profile[fieldName]?.value || "" : "");

		// Auto-Clean & Title Case formatting for Student Name and Guide Name
		if (fieldName === "Name" || fieldName === "GuideName") {
			displayVal = this.#toTitleCase(displayVal);
		}

		document.querySelectorAll(".val-" + fieldName).forEach((el) => {
			el.textContent = displayVal;
			el.classList.toggle("is-ghost-sample", isGhost);
		});
	}

	#toTitleCase(str) {
		if (!str) return "";
		return str
			.trim()
			.replace(/\s+/g, " ")
			.toLowerCase()
			.replace(/(?:^|\s|-|\.)\S/g, (char) => char.toUpperCase());
	}

	#syncProjectSoftware(val) {
		const trimmed = (val || "").trim();
		const isGhost = trimmed === "" && this.#isSampleGhostActive;
		const profile = I18nService.getSampleProfile();
		const targetVal = trimmed !== "" ? val : (isGhost ? profile["ProjectSoftware"]?.value || "" : "");

		const [line1, line2, line3] = this.#splitSoftwareIntoLines(targetVal);

		document.querySelectorAll(".val-ProjectSoftware-1").forEach((el) => {
			el.textContent = line1;
			el.classList.toggle("is-ghost-sample", isGhost);
		});
		document.querySelectorAll(".val-ProjectSoftware-2").forEach((el) => {
			el.textContent = line2;
			el.classList.toggle("is-ghost-sample", isGhost);
		});
		document.querySelectorAll(".val-ProjectSoftware-3").forEach((el) => {
			el.textContent = line3;
			el.classList.toggle("is-ghost-sample", isGhost);
		});
	}

	#splitSoftwareIntoLines(text, maxLine1 = 44, maxLine2 = 80) {
		if (!text) return ["", "", ""];
		const trimmed = text.trim();
		if (!trimmed) return ["", "", ""];

		const explicitLines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
		if (explicitLines.length > 1) {
			return [explicitLines[0] || "", explicitLines[1] || "", explicitLines.slice(2).join(", ") || ""];
		}

		const tokens = trimmed.split(/(\s+|,\s*)/);
		let l1 = "";
		let l2 = "";
		let l3 = "";
		let currentLine = 1;

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (!token) continue;
			if (currentLine === 1) {
				if ((l1 + token).length <= maxLine1) {
					l1 += token;
				} else {
					currentLine = 2;
					l2 += token.trimStart();
				}
			} else if (currentLine === 2) {
				if ((l2 + token).length <= maxLine2) {
					l2 += token;
				} else {
					currentLine = 3;
					l3 += token.trimStart();
				}
			} else {
				l3 += token;
			}
		}

		return [l1.trim(), l2.trim(), l3.trim()];
	}

	#syncSubmissionYear(dateVal) {
		const trimmed = (dateVal || "").trim();
		const match = trimmed.match(/\b(20\d\d|19\d\d)\b/);
		let year = "";
		let isGhost = false;
		if (match) {
			year = match[1];
		} else if (this.#isSampleGhostActive) {
			const profile = I18nService.getSampleProfile();
			year = profile["SubmissionYear"]?.value || "2026";
			isGhost = true;
		}

		document.querySelectorAll(".val-SubmissionYear").forEach((el) => {
			el.textContent = year;
			el.classList.toggle("is-ghost-sample", isGhost);
		});

		// If year is present, show colon; if empty, preserve clean original text "Year of Submission"
		document.querySelectorAll(".statement-year-lbl").forEach((el) => {
			el.textContent = year ? "Year of Submission: " : "Year of Submission";
		});
	}

	#initTechChips() {
		const softwareInput = document.getElementById("inputProjectSoftware");
		if (!softwareInput) return;

		// Listen to user typing in input to reactively sync chips
		softwareInput.addEventListener("input", () => {
			this.#updateTechChipsUI(softwareInput.value);
		});

		document.querySelectorAll(".tech-chip").forEach((chip) => {
			chip.addEventListener("click", () => {
				const tech = chip.getAttribute("data-tech");
				if (!tech) return;

				const currentVal = softwareInput.value.trim();
				// Split by comma, trim, filter out empty
				let items = currentVal ? currentVal.split(",").map((s) => s.trim()).filter(Boolean) : [];

				// Check if this tech is already included (case-insensitive)
				const existingIndex = items.findIndex((item) => item.toLowerCase() === tech.toLowerCase());

				if (existingIndex !== -1) {
					// Uncheck / Remove
					items.splice(existingIndex, 1);
				} else {
					// Check / Add
					items.push(tech);
				}

				const updatedVal = items.join(", ");
				softwareInput.value = updatedVal;
				StorageService.set("field_ProjectSoftware", updatedVal);
				this.#syncToDOM("ProjectSoftware", updatedVal);
				this.#updateTechChipsUI(updatedVal);
				if (this.#onChangeCallback) this.#onChangeCallback("ProjectSoftware", updatedVal);
			});
		});

		// Initial state sync
		this.#updateTechChipsUI(softwareInput.value);
	}

	#updateTechChipsUI(val = "") {
		const items = (val || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
		document.querySelectorAll(".tech-chip").forEach((chip) => {
			const tech = chip.getAttribute("data-tech");
			if (!tech) return;

			const isChecked = items.includes(tech.toLowerCase());
			chip.classList.toggle("is-active", isChecked);
			chip.setAttribute("aria-checked", isChecked ? "true" : "false");

			const iconEl = chip.querySelector(".chip-icon");
			if (iconEl) {
				iconEl.textContent = isChecked ? "✓" : "+";
			}
		});
	}

	syncAllFields() {
		const profile = I18nService.getSampleProfile();
		this.#projectFields.forEach((fieldName) => {
			if (fieldName === "GuideDegree" || fieldName === "FirstSubmission") return;
			const input = document.getElementById("input" + fieldName) || document.querySelector(`[data-field="${fieldName}"]`);
			const userVal = input ? input.value : StorageService.get("field_" + fieldName, "");
			const trimmed = (userVal || "").trim();
			const isGhost = trimmed === "" && this.#isSampleGhostActive;
			const displayVal = trimmed !== "" ? userVal : (isGhost ? profile[fieldName]?.value || "" : "");

			document.querySelectorAll(".val-" + fieldName).forEach((el) => {
				el.textContent = displayVal;
				el.classList.toggle("is-ghost-sample", isGhost);
			});
		});

		// Auto-derive and sync SubmissionYear from SubmissionDate
		const subDateInput = document.getElementById("inputSubmissionDate");
		const subDateVal = subDateInput ? subDateInput.value : StorageService.get("field_SubmissionDate", "");
		this.#syncSubmissionYear(subDateVal);

		// Sync ProjectSoftware across 3 lines
		const swInput = document.getElementById("inputProjectSoftware") || document.querySelector('[data-field="ProjectSoftware"]');
		const swVal = swInput ? swInput.value : StorageService.get("field_ProjectSoftware", "");
		this.#syncProjectSoftware(swVal);
		this.#updateTechChipsUI(swVal);

		// Sync Degree Checkboxes to Document Checkboxes
		let activeDegrees = Array.from(document.querySelectorAll('input[name="GuideDegree"]:checked')).map((el) => el.value);
		if (activeDegrees.length === 0) {
			const saved = StorageService.get("field_GuideDegree", null);
			if (saved) activeDegrees = Array.isArray(saved) ? saved : [saved];
			else if (this.#isSampleGhostActive) activeDegrees = ["phd"];
		}
		this.#syncDegreeToDOM(activeDegrees);

		const activeFirst = document.querySelector('input[name="FirstSubmission"]:checked')?.value || StorageService.get("field_FirstSubmission", "yes");
		this.#syncFirstSubmissionToDOM(activeFirst);
	}
}

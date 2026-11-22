/**
 * DataManagerService
 * Single Responsibility: Backup export packaging, file validation, security sanitization,
 * and safe restoration into StorageService. Zero DOM or UI presentation code.
 */
import { StorageService } from "./storage.service.js";

export class DataManagerService {
	static APP_ID = "IGNOU Document Automation Hub";
	static VERSION = "1.0";
	static MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB max

	// Strict Whitelist of valid keys and their types
	static #WHITELIST_KEYS = Object.freeze({
		// Student Bio / Profile
		field_Name: "string",
		field_Enrolment: "string",
		field_Address1: "string",
		field_Address2: "string",
		field_Phone: "string",
		field_Email: "string",
		field_ProgrammeCode: "string",
		field_Programme: "string",
		field_CourseCode: "string",
		field_CourseTitle: "string",
		field_AssignmentNo: "string",
		field_StudyCentreCode: "string",
		field_StudyCentreName: "string",
		field_StudyCentreAddress1: "string",
		field_RegionalCentre: "string",
		field_RegionalCentreCode: "string",

		// Project Synopsis Kit Fields
		field_ProjectTitle: "string",
		field_GuideName: "string",
		field_GuideAddress1: "string",
		field_GuideAddress2: "string",
		field_GuideDegree: "array",
		field_GuideExperience: "string",
		field_ProjectSoftware: "string",
		field_SubmissionDate: "string",
		field_GuideDate: "string",
		field_FirstSubmission: "string",
		field_SubmissionYear: "string",
		project_programme: "string",
		project_selected_docs: "array",

		// Assignment Covers Settings
		checkedCodes: "array",
		semView: "string",
		templateDesignKey: "string",
		templateFontKey: "string",
		handFont: "string",
		inkColor: "string",
		activeStudioTab: "string",
		pageSizeKey: "string",
		deckMode: "string",
		isSampleGhostActive: "boolean",

		// Global Preferences
		theme: "string",
		app_lang: "string",

		// Signatures & Scales
		signature_webp: "signature",
		guide_signature_webp: "signature",
		signature_scale: "scale",
		guide_signature_scale: "scale",
	});

	/**
	 * Sanitizes a string: removes script/style blocks, all HTML tags, and trims length.
	 */
	static #sanitizeString(val, maxLength = 800) {
		if (typeof val !== "string") return "";
		// Strip script, style, iframe, object, embed tags AND their contents
		let clean = val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
		clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
		clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
		// Strip any remaining HTML tags
		clean = clean.replace(/<[^>]*>?/gm, "");
		return clean.trim().slice(0, maxLength);
	}

	/**
	 * Validates a base64 image data URL (WebP, PNG, JPEG).
	 */
	static #isValidSignature(val) {
		if (typeof val !== "string") return false;
		return /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(val);
	}

	/**
	 * Validates and clamps signature zoom scale between 0.5 and 3.0.
	 */
	static #sanitizeScale(val) {
		const num = parseFloat(val);
		if (isNaN(num)) return 1.0;
		return Math.min(Math.max(num, 0.5), 3.0);
	}

	/**
	 * Sanitizes an array of strings (e.g. course codes or degree keys).
	 */
	static #sanitizeArray(val) {
		if (!Array.isArray(val)) return [];
		return val
			.filter((item) => typeof item === "string")
			.map((item) => this.#sanitizeString(item, 100))
			.slice(0, 50); // limit max items
	}

	/**
	 * Generates a clean backup object from current StorageService state.
	 */
	static createBackupPayload() {
		const allData = StorageService.getAllPrefixed();
		const payload = {};

		for (const [key, type] of Object.entries(this.#WHITELIST_KEYS)) {
			if (Object.prototype.hasOwnProperty.call(allData, key) && allData[key] !== null && allData[key] !== undefined) {
				payload[key] = allData[key];
			}
		}

		const studentSummary = {
			name: this.#sanitizeString(StorageService.get("field_Name", "")),
			enrolment: this.#sanitizeString(StorageService.get("field_Enrolment", "")),
			programme: this.#sanitizeString(StorageService.get("field_ProgrammeCode", "MCA_NEW")),
			hasStudentSig: !!StorageService.get("signature_webp", null),
			hasGuideSig: !!StorageService.get("guide_signature_webp", null),
		};

		return {
			app: this.APP_ID,
			version: this.VERSION,
			exportedAt: new Date().toISOString(),
			studentSummary,
			payload,
		};
	}

	/**
	 * Exports backup file and triggers browser download.
	 */
	static exportBackupFile() {
		const backupData = this.createBackupPayload();
		const jsonStr = JSON.stringify(backupData, null, 2);
		const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });

		const enrolment = backupData.studentSummary.enrolment || "profile";
		const dateStr = new Date().toISOString().slice(0, 10);
		const filename = `ignou_backup_${enrolment}_${dateStr}.json`;

		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();

		setTimeout(() => {
			document.body.removeChild(anchor);
			URL.revokeObjectURL(url);
		}, 200);

		return { filename, totalFields: Object.keys(backupData.payload).length };
	}

	/**
	 * Validates and sanitizes an uploaded JSON File object.
	 * Returns a sanitized payload with summary or throws an Error.
	 */
	static async validateBackupFile(file) {
		if (!file) {
			throw new Error("कोई फ़ाइल नहीं चुनी गई।");
		}

		if (file.size > this.MAX_FILE_SIZE_BYTES) {
			throw new Error("फ़ाइल का आकार 3MB की सीमा से अधिक है।");
		}

		const text = await file.text();
		let json;
		try {
			json = JSON.parse(text);
		} catch {
			throw new Error("फ़ाइल अमान्य JSON फ़ॉर्मेट में है।");
		}

		if (!json || typeof json !== "object") {
			throw new Error("अमान्य डेटा संरचना।");
		}

		// Magic App Header check
		if (json.app !== this.APP_ID || json.version !== this.VERSION) {
			throw new Error("अमान्य फ़ाइल: यह आधिकारिक IGNOU बैकअप फ़ाइल नहीं है।");
		}

		if (!json.payload || typeof json.payload !== "object") {
			throw new Error("बैकअप पेलोड रिक्त या अमान्य है।");
		}

		// Strict Whitelist Sanitization Loop (Anti-XSS & Type Enforcement)
		const sanitizedPayload = {};
		let restoredCount = 0;

		for (const [key, type] of Object.entries(this.#WHITELIST_KEYS)) {
			if (Object.prototype.hasOwnProperty.call(json.payload, key)) {
				const rawVal = json.payload[key];

				if (type === "string") {
					sanitizedPayload[key] = this.#sanitizeString(rawVal);
					restoredCount++;
				} else if (type === "signature") {
					if (this.#isValidSignature(rawVal)) {
						sanitizedPayload[key] = rawVal;
						restoredCount++;
					}
				} else if (type === "scale") {
					sanitizedPayload[key] = this.#sanitizeScale(rawVal);
					restoredCount++;
				} else if (type === "array") {
					sanitizedPayload[key] = this.#sanitizeArray(rawVal);
					restoredCount++;
				} else if (type === "boolean") {
					sanitizedPayload[key] = Boolean(rawVal);
					restoredCount++;
				}
			}
		}

		const summary = {
			name: this.#sanitizeString(json.studentSummary?.name || sanitizedPayload.field_Name || "अज्ञात"),
			enrolment: this.#sanitizeString(json.studentSummary?.enrolment || sanitizedPayload.field_Enrolment || "N/A"),
			programme: this.#sanitizeString(json.studentSummary?.programme || sanitizedPayload.field_ProgrammeCode || "MCA"),
			exportedAt: json.exportedAt ? new Date(json.exportedAt).toLocaleDateString() : "अज्ञात",
			hasStudentSig: !!sanitizedPayload.signature_webp,
			hasGuideSig: !!sanitizedPayload.guide_signature_webp,
			fieldCount: restoredCount,
		};

		return {
			valid: true,
			summary,
			payload: sanitizedPayload,
		};
	}

	/**
	 * Restores validated payload to StorageService.
	 * mode: "overwrite" (replace all keys) | "merge" (fill empty only)
	 */
	static restorePayload(sanitizedPayload, mode = "overwrite") {
		if (!sanitizedPayload || typeof sanitizedPayload !== "object") {
			throw new Error("रीस्टोर करने के लिए कोई मान्य पेलोड नहीं है।");
		}

		let updatedCount = 0;

		for (const [key, val] of Object.entries(sanitizedPayload)) {
			if (mode === "merge") {
				const current = StorageService.get(key, null);
				if (current === null || current === "" || (Array.isArray(current) && current.length === 0)) {
					StorageService.set(key, val);
					updatedCount++;
				}
			} else {
				// Default Overwrite
				StorageService.set(key, val);
				updatedCount++;
			}
		}

		// Notify entire application through CustomEvent
		window.dispatchEvent(
			new CustomEvent("app:dataRestored", {
				detail: { mode, updatedCount },
			})
		);

		return { success: true, updatedCount };
	}

	/**
	 * Completely clears all application data with confirmation.
	 */
	static clearAllData() {
		StorageService.clearPrefixed();
		window.dispatchEvent(new CustomEvent("app:dataCleared"));
		return { success: true };
	}
}

/**
 * IGNOU Document Automation Hub - Unified Data Vault Schema & SSOT
 *
 * यह फ़ाइल पूरे एप्लिकेशन के डेटा स्ट्रक्चर की सिंगल सोर्स ऑफ़ ट्रुथ (SSOT) है।
 * यह सुनिश्चित करती है कि छात्र, गाइड, प्रोजेक्ट और असाइनमेंट का डेटा कभी बिखरे नहीं,
 * और बैकअप/रिस्टोर (Export/Import) एक सुव्यवस्थित JSON ऑब्जेक्ट के रूप में हो सके।
 *
 * =============================================================================
 * संरचना (DOMAINS OVERVIEW):
 * =============================================================================
 * 1. meta        - स्कीमा वर्ज़न, एक्सपोर्ट टाइमस्टैम्प आदि।
 * 2. student     - छात्र की पहचान (Universal Identity across Hub).
 * 3. guide       - गाइड/मेंटर प्रोफाइल (Independent Academic Guide details).
 * 4. project     - प्रोजेक्ट विवरण व विनिर्देश (Artifact Metadata & Specifications).
 * 5. assignment  - असाइनमेंट फ्रंट पेज मॉड्यूल स्टेट (Selected Courses, Themes).
 * 6. preferences - यूजर सेटिंग्स (Locale, Deck/Sheet Mode, Sample Toggle).
 *
 * =============================================================================
 * उपयोग कैसे करें (HOW TO USE IN CODE):
 * =============================================================================
 * // नया डिफ़ॉल्ट स्ट्रक्चर प्राप्त करना:
 * import { createDefaultHubState, validateHubState } from "../data/hub_schema.js";
 * const freshState = createDefaultHubState();
 *
 * // बैकअप JSON वैलिडेट करना:
 * const isValid = validateHubState(uploadedJSON);
 */

/**
 * @typedef {Object} DigitalSignature
 * @property {string|null} data - Transparent WebP Base64 Data URL or null
 * @property {number} scale - CSS scale multiplier (0.5 to 2.0, default 1.0)
 */

/**
 * @typedef {Object} StudentProfile
 * @property {string} enrolment - 9 or 10 digit IGNOU Enrolment Number
 * @property {string} name - Student's full name as per IGNOU ID
 * @property {string} address1 - Address Line 1 (House/Street/Locality)
 * @property {string} address2 - Address Line 2 (City, State, PIN)
 * @property {string} studyCentreCode - IGNOU Study Centre Code (e.g. "2906")
 * @property {string} studyCentreName - Study Centre College/Institution Name
 * @property {string} regionalCentre - Regional Centre Name (e.g. "Delhi-3")
 * @property {string} regionalCentreCode - Regional Centre Code (e.g. "38")
 * @property {string} phone - Mobile / WhatsApp Contact Number
 * @property {string} email - Student's Email ID
 * @property {DigitalSignature} signature - Student's digital ink signature
 */

/**
 * @typedef {Object} GuideProfile
 * @property {string} name - Full Name of the Project Guide (with Dr./Prof.)
 * @property {string} address1 - Guide Address Line 1 (Department / Faculty)
 * @property {string} address2 - Guide Address Line 2 (University, Campus, PIN)
 * @property {string[]} degrees - Array of approved qualifications: 'phd', 'mtech', 'be_btech', 'mca', 'msc'
 * @property {string} experience - Teaching / Working Experience description
 * @property {DigitalSignature} signature - Guide's digital ink signature
 * @property {string} date - Date of Guide's signature (DD/MM/YYYY) or blank
 */

/**
 * @typedef {Object} ProjectOrganization
 * @property {string} name - Training Company / Institution Name (for Trainee Letter)
 * @property {string} address - Organization Address
 */

/**
 * @typedef {Object} ProjectParticulars
 * @property {string} programmeCode - Programme ID (e.g. "MCA_NEW")
 * @property {string} courseCode - Project Course Code (e.g. "MCSP-232")
 * @property {string} title - Full Title of the Project Proposal
 * @property {string} software - Software / Tools used (as per official Section VIII)
 * @property {"yes"|"no"} firstSubmission - Whether this is first submission or resubmission
 * @property {string} submissionDate - Date of Student's Submission (DD/MM/YYYY)
 * @property {string} [submissionYear] - Year of Submission (auto-derived from submissionDate, e.g. "2026")
 * @property {string[]} selectedDocIds - IDs of checked documents to print/preview
 */

/**
 * @typedef {Object} AssignmentModuleData
 * @property {string[]} selectedCourses - Course codes selected for assignment covers (e.g. ['MCS-211'])
 * @property {string} templateDesign - Active design template key ('classic'|'modern'|'gazette'|'portfolio')
 * @property {string} handFont - Handwriting font preference key
 * @property {string} colorTheme - Primary hex color theme for assignment sheet
 */

/**
 * @typedef {Object} UserPreferences
 * @property {"hi"|"en"} locale - Application language locale
 * @property {"deck"|"sheet"} deckMode - Active stage view mode (3D Deck vs 1:1 Flat Sheet)
 * @property {boolean} isSampleGhostActive - Whether sample placeholder ghost data is active
 */

/**
 * @typedef {Object} HubVaultState
 * @property {{ version: string, exportedAt: string }} meta
 * @property {StudentProfile} student
 * @property {GuideProfile} guide
 * @property {ProjectParticulars} project
 * @property {AssignmentModuleData} assignment
 * @property {UserPreferences} preferences
 */

/**
 * Creates a clean, empty Hub State structure adhering 100% to the vault schema.
 * @returns {HubVaultState}
 */
export function createDefaultHubState() {
	return {
		meta: {
			version: "1.0",
			exportedAt: new Date().toISOString(),
		},

		// 1. Shared Student Profile (Single Source of Truth across tools)
		student: {
			enrolment: "",
			name: "",
			address1: "",
			address2: "",
			studyCentreCode: "",
			studyCentreName: "",
			regionalCentre: "",
			regionalCentreCode: "",
			phone: "",
			email: "",
			signature: {
				data: null,
				scale: 1.0,
			},
		},

		// 2. Guide Profile (Independent Mentor Credentials)
		guide: {
			name: "",
			address1: "",
			address2: "",
			degrees: ["phd"],
			experience: "",
			signature: {
				data: null,
				scale: 1.0,
			},
			date: "",
		},

		// 3. Project Particulars & Metadata (Artifact details)
		project: {
			programmeCode: "MCA_NEW",
			courseCode: "MCSP-232",
			title: "",
			software: "",
			firstSubmission: "yes",
			submissionYear: String(new Date().getFullYear()),
			submissionDate: "",
			selectedDocIds: ["proforma", "trainee_letter", "originality", "project_cover"],
			organization: {
				name: "",
				address: "",
			},
		},

		// 4. Assignment Module State (Only for Assignment Front Page Studio)
		assignment: {
			selectedCourses: [],
			templateDesign: "classic",
			handFont: "Patrick Hand",
			colorTheme: "#003366",
		},

		// 5. User Preferences & Settings
		preferences: {
			locale: "hi",
			deckMode: "sheet",
			isSampleGhostActive: false,
		},
	};
}

/**
 * Validates whether an incoming object conforms to the Hub Vault Schema.
 * Useful for Backup Import / Restore validation.
 * @param {any} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateHubState(obj) {
	const errors = [];
	if (!obj || typeof obj !== "object") {
		return { valid: false, errors: ["Data is not a valid JSON object"] };
	}

	if (!obj.student || typeof obj.student !== "object") {
		errors.push("Missing 'student' domain object");
	}
	if (!obj.guide || typeof obj.guide !== "object") {
		errors.push("Missing 'guide' domain object");
	}
	if (!obj.project || typeof obj.project !== "object") {
		errors.push("Missing 'project' domain object");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Safe Migration Helper:
 * Reads older flat localStorage keys (e.g. 'field_Enrolment', 'field_Name', 'signature_webp')
 * and hydrates a structured HubVaultState without losing any of the user's existing work.
 * @param {Object} storageService - StorageService instance
 * @returns {HubVaultState} Migrated structured state
 */
export function migrateLegacyStorage(storageService) {
	const state = createDefaultHubState();
	if (!storageService) return state;

	// Student Profile Migration
	state.student.enrolment = storageService.get("field_Enrolment", "") || "";
	state.student.name = storageService.get("field_Name", "") || "";
	state.student.address1 = storageService.get("field_Address1", "") || "";
	state.student.address2 = storageService.get("field_Address2", "") || "";
	state.student.studyCentreCode = storageService.get("field_StudyCentreCode", "") || storageService.get("field_StudyCentre1", "") || "";
	state.student.studyCentreName = storageService.get("field_StudyCentreName", "") || storageService.get("field_StudyCentre2", "") || "";
	state.student.regionalCentre = storageService.get("field_RegionalCentre", "") || "";
	state.student.regionalCentreCode = storageService.get("field_RegionalCentreCode", "") || "";
	state.student.phone = storageService.get("field_Phone", "") || "";
	state.student.email = storageService.get("field_Email", "") || "";
	state.student.signature.data = storageService.get("signature_webp", null);
	state.student.signature.scale = storageService.get("signature_scale", 1.0);

	// Guide Profile Migration
	state.guide.name = storageService.get("field_GuideName", "") || "";
	state.guide.address1 = storageService.get("field_GuideAddress1", "") || "";
	state.guide.address2 = storageService.get("field_GuideAddress2", "") || storageService.get("field_GuideAddress", "") || "";
	const savedDeg = storageService.get("field_GuideDegree", ["phd"]);
	state.guide.degrees = Array.isArray(savedDeg) ? savedDeg : [savedDeg];
	state.guide.experience = storageService.get("field_GuideExperience", "") || "";
	state.guide.date = storageService.get("field_GuideDate", "") || "";
	state.guide.signature.data = storageService.get("guide_signature_webp", null);
	state.guide.signature.scale = storageService.get("guide_signature_scale", 1.0);

	// Project Particulars Migration
	state.project.title = storageService.get("field_ProjectTitle", "") || "";
	state.project.software = storageService.get("field_ProjectSoftware", "") || "";
	state.project.firstSubmission = storageService.get("field_FirstSubmission", "yes") || "yes";
	state.project.submissionYear = storageService.get("field_SubmissionYear", String(new Date().getFullYear()));
	state.project.submissionDate = storageService.get("field_SubmissionDate", "");
	state.project.organization.name = storageService.get("field_OrgName", "") || "";
	state.project.organization.address = storageService.get("field_OrgAddress", "") || "";
	const savedDocs = storageService.get("project_selected_docs", null);
	if (Array.isArray(savedDocs) && savedDocs.length > 0) {
		state.project.selectedDocIds = savedDocs;
	}

	// Preferences Migration
	state.preferences.locale = storageService.get("app_locale", "hi");
	state.preferences.deckMode = storageService.get("deckMode", "sheet");
	state.preferences.isSampleGhostActive = storageService.get("isSampleGhostActive", false);

	return state;
}

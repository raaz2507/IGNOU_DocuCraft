/**
 * Project Programmes & Documents Catalog (Single Source of Truth)
 * Extensible Architecture: To add future programmes (e.g. BCA, etc.), simply append an object
 * to this array. The UI dropdown and template hydration will pick it up automatically without
 * modifying any application JavaScript.
 */
export const PROJECT_PROGRAMMES = Object.freeze([
	{
		code: "MCA_NEW",
		title: "Master of Computer Applications",
		courseCode: "MCSP-232",
		courseTitle: "Project (MCA)",
		school: "School of Computer and Information Sciences",
		schoolHindi: "कंप्यूटर एवं सूचना विज्ञान विद्यापीठ",
		degreeName: "MASTER OF COMPUTER APPLICATIONS",
		credits: 12,
	},
]);

export const PROJECT_DOCUMENTS = Object.freeze([
	{
		id: "proforma",
		key: "doc_proforma",
		name: "Annexure II: Project Proposal Approval Proforma",
		nameHindi: "अनुलग्नक II: परियोजना प्रस्ताव अनुमोदन प्रोफार्मा",
		sub: "Proforma for Approval of Project Proposal (Guide & Evaluator)",
		defaultChecked: true,
	},
	{
		id: "trainee_letter",
		key: "doc_trainee_letter",
		name: "Project Trainee Request Letter",
		nameHindi: "प्रोजेक्ट ट्रेनी अनुरोध पत्र",
		sub: "Official Institutional Request Letter for Company/Org Training",
		defaultChecked: true,
	},
	{
		id: "originality",
		key: "doc_originality",
		name: "Annexure X: Certificate of Originality",
		nameHindi: "अनुलग्नक X: मौलिकता का प्रमाण पत्र",
		sub: "Declaration of Authenticity & Originality by Student & Guide",
		defaultChecked: true,
	},
	{
		id: "project_cover",
		key: "doc_project_cover",
		name: "Annexure XI: Project Report / Synopsis Cover Page",
		nameHindi: "अनुलग्नक XI: प्रोजेक्ट रिपोर्ट / सिनॉप्सिस कवर पेज",
		sub: "Official Submission Cover Sheet for Synopsis & Report",
		defaultChecked: true,
	},
]);

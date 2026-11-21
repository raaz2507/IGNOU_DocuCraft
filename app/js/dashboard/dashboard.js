/**
 * DashboardApp
 * Orchestrator for the IGNOU Doc Automation Hub (index.html).
 * Loads live A4 assignment cover thumbnail into the portrait playing card.
 */
import { TemplateRegistry } from "../front_page/templates/index.js";
import { StorageService } from "../shared/storage.service.js";

export class DashboardApp {
	constructor() {
		this.init();
	}

	init() {
		this.renderThumbnail();
		this.bindEvents();
	}

	renderThumbnail() {
		const slot = document.getElementById("assignmentThumbnailSlot");
		if (!slot) return;

		// Reusable course sample for live preview
		const sampleCourse = {
			code: "MCSL-228",
			title: "Web Technologies Lab",
			assign: "MCA(3)/L-228/Assign/2026",
		};

		const savedName = StorageService.get("field_Name", "");
		const savedEnrol = StorageService.get("field_Enrolment", "");
		const savedProg = StorageService.get("field_Programme", "Master of Computer Applications (MCA_NEW)");

		// Render the real Classic IGNOU template HTML directly without rewrite
		slot.innerHTML = TemplateRegistry.render("classic", sampleCourse, false, "", "./assets/IGNOU_logo.svg");

		// If student has saved credentials, show them in handwritten ink inside thumbnail!
		if (savedName) {
			const nameEl = slot.querySelector(".val-Name");
			if (nameEl) nameEl.textContent = savedName;
		}
		if (savedEnrol) {
			const enrolEl = slot.querySelector(".val-Enrolment");
			if (enrolEl) enrolEl.textContent = savedEnrol;
		}
		if (savedProg) {
			const progEl = slot.querySelector(".val-Programme");
			if (progEl) progEl.textContent = savedProg;
		}
	}

	bindEvents() {
		// Project kit upcoming card notice
		const cardProjectSynopsis = document.getElementById("cardProjectSynopsis");
		if (cardProjectSynopsis) {
			cardProjectSynopsis.addEventListener("click", () => {
				const currentLang = StorageService.get("lang", "en");
				const msg =
					currentLang === "hi"
						? "🎓 MCA प्रोजेक्ट किट (MCSP-232 प्रोफार्मा एवं प्रमाणपत्र) पर वर्तमान में काम चल रहा है।\n\nकृपया अपने सभी सेमेस्टर्स के लिए 'असाइनमेंट फ्रंट पेज' का उपयोग करें!"
						: "🎓 MCA Project Kit (MCSP-232 Proforma & Certificates) is currently in active development.\n\nPlease use Assignment Front Page for your course assignments!";
				alert(msg);
			});
		}
	}
}

// Bootstrap dashboard on DOM ready
window.addEventListener("DOMContentLoaded", () => {
	window.dashboardApp = new DashboardApp();
});

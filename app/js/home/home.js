/**
 * HomeApp
 * Main orchestrator for the IGNOU Doc Automation Hub (index.html).
 * Loads live A4 assignment cover thumbnail into the portrait playing card.
 */
import { TemplateRegistry } from "../assignment_covers/templates/template_registry.js";
import { I18nService } from "../shared/i18n.service.js";

export class HomeApp {
	constructor() {
		this.init();
	}

	async init() {
		I18nService.init();
		await TemplateRegistry.preload(["classic"]);
		this.renderThumbnail();
		this.bindEvents();
	}

	renderThumbnail() {
		const slot = document.getElementById("assignmentThumbnailSlot");
		if (!slot) return;

		// Render authentic blank Classic IGNOU template without fake data
		slot.innerHTML = TemplateRegistry.render("classic");
	}

	bindEvents() {
		// Re-render thumbnail when locale changes
		window.addEventListener("app:localeChanged", () => {
			this.renderThumbnail();
		});

		// Project kit upcoming card notice
		const cardProjectSynopsis = document.getElementById("cardProjectSynopsis");
		if (cardProjectSynopsis) {
			cardProjectSynopsis.addEventListener("click", () => {
				const currentLang = I18nService.getLocale();
				const msg =
					currentLang === "hi"
						? "🎓 MCA प्रोजेक्ट किट (MCSP-232 प्रोफार्मा एवं प्रमाणपत्र) पर वर्तमान में काम चल रहा है।\n\nकृपया अपने सभी सेमेस्टर्स के लिए 'असाइनमेंट फ्रंट पेज' का उपयोग करें!"
						: "🎓 MCA Project Kit (MCSP-232 Proforma & Certificates) is currently in active development.\n\nPlease use Assignment Front Page for your course assignments!";
				alert(msg);
			});
		}
	}
}

// Backward compatibility alias
export const DashboardApp = HomeApp;

// Bootstrap HomeApp on DOM ready
window.addEventListener("DOMContentLoaded", () => {
	window.homeApp = new HomeApp();
});

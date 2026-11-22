/**
 * HelpApp
 * Single Responsibility: Interactive FAQ accordions and smooth scrolling for help.html.
 */
import { I18nService } from "../shared/i18n.service.js";

export class HelpApp {
	constructor() {
		this.init();
	}

	init() {
		I18nService.init();
		this.bindAccordion();
		this.bindSmoothScroll();
	}

	bindAccordion() {
		const triggers = document.querySelectorAll(".faq-trigger-btn");
		triggers.forEach((btn) => {
			btn.addEventListener("click", () => {
				const item = btn.closest(".faq-item");
				if (!item) return;

				const isOpen = item.classList.contains("open");

				// Optional: Accordion behavior (close others if desired, or allow multiple open)
				// Here we toggle the clicked item cleanly:
				item.classList.toggle("open", !isOpen);
			});
		});
	}

	bindSmoothScroll() {
		document.querySelectorAll(".jump-pill").forEach((anchor) => {
			anchor.addEventListener("click", (e) => {
				const targetId = anchor.getAttribute("href");
				if (targetId && targetId.startsWith("#")) {
					const el = document.querySelector(targetId);
					if (el) {
						e.preventDefault();
						el.scrollIntoView({ behavior: "smooth" });
					}
				}
			});
		});
	}
}

window.addEventListener("DOMContentLoaded", () => {
	window.helpApp = new HelpApp();
});

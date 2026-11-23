/**
 * PrintEngine
 * Manages physical paper configurations, dynamic @page CSS generation, and print invocation.
 * Single Responsibility: Print page dimensions, CSS print rules, and print trigger lifecycle.
 */
import { StorageService } from "../shared/storage.service.js";
import { AnalyticsService } from "../shared/analytics.service.js";

export class PrintEngine {
	static PAPER_CONFIGS = {
		a4: { width: "210mm", height: "297mm", printSize: "A4 portrait" },
		letter: { width: "215.9mm", height: "279.4mm", printSize: "letter portrait" },
		legal: { width: "215.9mm", height: "355.6mm", printSize: "legal portrait" },
		a5: { width: "148mm", height: "210mm", printSize: "A5 portrait" },
	};

	#pageSizeKey = "a4";
	#dom = {};
	#onPageSizeChangeCallback = null;

	constructor({ onPageSizeChange } = {}) {
		this.#onPageSizeChangeCallback = onPageSizeChange || null;
		this.#pageSizeKey = StorageService.get("pageSizeKey", "a4");
		this.#initDOM();
		this.#bindEvents();
		this.applyPageSize(this.#pageSizeKey);
	}

	get pageSizeKey() {
		return this.#pageSizeKey;
	}

	#initDOM() {
		this.#dom = {
			pageSizeSelect: document.getElementById("pageSizeSelect"),
			btnPrint: document.getElementById("btnPrint"),
			dynamicPrintStyle: document.getElementById("dynamicPrintStyle"),
		};
	}

	#bindEvents() {
		if (this.#dom.pageSizeSelect) {
			this.#dom.pageSizeSelect.addEventListener("change", (e) => {
				this.applyPageSize(e.target.value);
				if (this.#onPageSizeChangeCallback) {
					this.#onPageSizeChangeCallback(this.#pageSizeKey);
				}
			});
		}

		if (this.#dom.btnPrint) {
			this.#dom.btnPrint.addEventListener("click", () => this.print());
		}
	}

	applyPageSize(key) {
		this.#pageSizeKey = PrintEngine.PAPER_CONFIGS[key] ? key : "a4";
		StorageService.set("pageSizeKey", this.#pageSizeKey);

		const config = PrintEngine.PAPER_CONFIGS[this.#pageSizeKey];
		document.documentElement.style.setProperty("--page-width", config.width);
		document.documentElement.style.setProperty("--page-height", config.height);

		if (this.#dom.dynamicPrintStyle) {
			this.#dom.dynamicPrintStyle.textContent = `@page { size: ${config.printSize}; margin: 0; }`;
		}

		if (this.#dom.pageSizeSelect) {
			this.#dom.pageSizeSelect.value = this.#pageSizeKey;
		}
	}

	print() {
		const courses = StorageService.get("checkedCodes", []);
		if (Array.isArray(courses) && courses.length > 0) {
			AnalyticsService.trackAssignmentPrint(courses);
		}
		window.print();
	}
}

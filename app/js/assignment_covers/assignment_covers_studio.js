/**
 * AssignmentCoversStudioApp
 * Master application orchestrator for IGNOU Assignment Covers Studio.
 * Single Responsibility: Component orchestration, template hydration, and tab/mobile UI event coordination.
 */
import { StorageService } from "../shared/storage.service.js";
import { I18nService } from "../shared/i18n.service.js";
import { CurriculumStore } from "../shared/curriculum.store.js";
import { TemplateRegistry } from "./templates/template_registry.js";
import { CoverLightboxModal } from "./lightbox_modal.js";
import { CoverDeckController } from "./deck_controller.js";
import { StudentBioForm } from "./student_bio_form.js";
import { CourseSelector } from "./course_selector.js";
import { PrintEngine } from "./print_engine.js";

export class AssignmentCoversStudioApp {
	#templateDesignKey;
	#templateFontKey;
	#handFont;
	#inkColor;
	#activeStudioTab;
	#dom = {};

	constructor() {
		this.#templateDesignKey = StorageService.get("templateDesignKey", "classic");
		this.#templateFontKey = StorageService.get("templateFontKey", "academic-serif");
		let savedHandFont = StorageService.get("handFont", "'Kalam', cursive");
		if (savedHandFont.includes("Caveat")) {
			savedHandFont = "'Kalam', cursive";
			StorageService.set("handFont", savedHandFont);
		}
		this.#handFont = savedHandFont;
		this.#inkColor = StorageService.get("inkColor", "#0038a8");
		this.#activeStudioTab = StorageService.get("activeStudioTab", "coursesDesign");

		this.#initDOM();
		this.#initSubmodules();
		this.#bindEvents();

		// Preload templates & initial render
		TemplateRegistry.preload(["classic", "modern", "gazette", "portfolio"]).then(() => {
			this.renderPages();
		});

		this.#populateDropdowns();
		this.#applyTypographyTokens();
		this.#switchStudioTab(this.#activeStudioTab, false);
		this.#updateResponsiveScale();
	}

	#initDOM() {
		this.#dom = {
			pagesContainer: document.getElementById("pagesContainer"),
			templateDesignSelect: document.getElementById("templateDesignSelect"),
			templateFontSelect: document.getElementById("templateFontSelect"),
			handFontSelect: document.getElementById("handFontSelect"),
			colorPalette: document.getElementById("colorPalette"),
			tabBtnCoursesDesign: document.getElementById("tabBtnCoursesDesign"),
			tabBtnStudentBio: document.getElementById("tabBtnStudentBio"),
			paneCoursesDesign: document.getElementById("paneCoursesDesign"),
			paneStudentBio: document.getElementById("paneStudentBio"),
			controlPanel: document.getElementById("controlPanel"),
			btnToggleMobileSheet: document.getElementById("btnToggleMobileSheet"),
			btnCloseMobileSheet: document.getElementById("btnCloseMobileSheet"),
			mobileSheetBackdrop: document.getElementById("mobileSheetBackdrop"),
			sheetChevron: document.getElementById("sheetChevron"),
			accordionHeader: document.getElementById("accordionHeader"),
			accordionBody: document.getElementById("accordionBody"),
			btnTriggerLightbox: document.getElementById("btnTriggerLightbox"),
		};
	}

	#initSubmodules() {
		// 1. Deck Controller
		this.deckController = new CoverDeckController({
			onActiveChange: (idx) => {
				if (this.lightboxModal?.isOpen) {
					this.lightboxModal.setActiveIndex(idx);
					this.lightboxModal.renderContent(this.#dom.pagesContainer);
				}
			},
			onCardClick: (idx) => {
				this.lightboxModal?.open(idx, this.#dom.pagesContainer);
			},
		});

		// 2. Lightbox Modal
		this.lightboxModal = new CoverLightboxModal({
			cardsContainer: this.#dom.pagesContainer,
			onPageChange: (idx) => {
				this.deckController?.goToIndex(idx);
			},
		});

		// 3. Student Bio Form
		this.bioForm = new StudentBioForm({
			onFormChange: (fieldName) => {
				if (fieldName === "signature") {
					this.renderPages();
				}
			},
		});

		// 4. Course Selector
		this.courseSelector = new CourseSelector({
			onSelectionChange: () => {
				this.renderPages();
			},
		});

		// 5. Print Engine
		this.printEngine = new PrintEngine({
			onPageSizeChange: () => {
				this.#updateResponsiveScale();
			},
		});
	}

	#bindEvents() {
		// Studio Tabs
		if (this.#dom.tabBtnCoursesDesign) {
			this.#dom.tabBtnCoursesDesign.addEventListener("click", () => this.#switchStudioTab("coursesDesign"));
		}
		if (this.#dom.tabBtnStudentBio) {
			this.#dom.tabBtnStudentBio.addEventListener("click", () => this.#switchStudioTab("studentBio"));
		}

		// Mobile Sheet Controls
		if (this.#dom.btnToggleMobileSheet) {
			this.#dom.btnToggleMobileSheet.addEventListener("click", () => this.#toggleMobileSheet());
		}
		if (this.#dom.btnCloseMobileSheet) {
			this.#dom.btnCloseMobileSheet.addEventListener("click", () => this.#toggleMobileSheet(false));
		}
		if (this.#dom.mobileSheetBackdrop) {
			this.#dom.mobileSheetBackdrop.addEventListener("click", () => this.#toggleMobileSheet(false));
		}

		// Accordion
		if (this.#dom.accordionHeader && this.#dom.accordionBody) {
			this.#dom.accordionHeader.addEventListener("click", () => {
				this.#dom.accordionHeader.classList.toggle("open");
				this.#dom.accordionBody.classList.toggle("open");
			});
		}

		// Lightbox Header Trigger
		if (this.#dom.btnTriggerLightbox) {
			this.#dom.btnTriggerLightbox.addEventListener("click", () => {
				this.lightboxModal.open(this.deckController.activeIndex, this.#dom.pagesContainer);
			});
		}

		// Template Design Selection
		if (this.#dom.templateDesignSelect) {
			this.#dom.templateDesignSelect.addEventListener("change", async (e) => {
				this.#templateDesignKey = e.target.value;
				StorageService.set("templateDesignKey", this.#templateDesignKey);
				await TemplateRegistry.preload([this.#templateDesignKey]);
				this.renderPages();
			});
		}

		// Typography Changes
		if (this.#dom.handFontSelect) {
			this.#dom.handFontSelect.addEventListener("change", (e) => {
				this.#handFont = e.target.value;
				StorageService.set("handFont", this.#handFont);
				this.#applyTypographyTokens();
			});
		}
		if (this.#dom.templateFontSelect) {
			this.#dom.templateFontSelect.addEventListener("change", (e) => {
				this.#templateFontKey = e.target.value;
				StorageService.set("templateFontKey", this.#templateFontKey);
				this.#applyTypographyTokens();
			});
		}

		// Ink Color Palette
		if (this.#dom.colorPalette) {
			this.#dom.colorPalette.addEventListener("click", (e) => {
				const pill = e.target.closest(".color-pill");
				if (pill) {
					this.setInkColor(pill.dataset.color, pill);
				}
			});
		}

		// Responsive scale on resize
		window.addEventListener("resize", () => {
			this.#updateResponsiveScale();
		});

		// Global Locale Change
		window.addEventListener("app:localeChanged", () => {
			this.#populateDropdowns();
			this.bioForm.updateSampleToggleButtonUI();
			this.bioForm.syncDOMValues();
			this.courseSelector.populateSemDropdown();
			this.renderPages();
		});

		// Keyboard Shortcuts
		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				if (this.lightboxModal?.isOpen) {
					this.lightboxModal.close();
					return;
				}
				this.#toggleMobileSheet(false);
				return;
			}
			const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
			if (tag === "input" || tag === "select" || tag === "textarea") return;

			if (!this.lightboxModal?.isOpen) {
				if (e.key === "ArrowLeft") this.deckController.prev();
				else if (e.key === "ArrowRight") this.deckController.next();
			}
		});
	}

	renderPages() {
		if (!this.#dom.pagesContainer) return;
		this.#dom.pagesContainer.innerHTML = "";

		const allCourses = CurriculumStore.getAllCourses();
		const selectedCourses = allCourses.filter((c) => this.courseSelector.checkedCodes.has(c.code));
		const hasSig = Boolean(this.bioForm.signatureData);
		const sigSrc = hasSig ? this.bioForm.signatureData : "";

		if (selectedCourses.length === 0) {
			const dummyCourse = {
				code: "IGNOU",
				title: "Assignment Cover Template",
				assign: "Academic Year 2024-25",
			};
			const renderedHtml = TemplateRegistry.render(this.#templateDesignKey, dummyCourse, hasSig, sigSrc);
			this.#dom.pagesContainer.innerHTML = `
				<div class="deck-card-item card-active" data-index="0" data-code="${dummyCourse.code}" data-title="${dummyCourse.title}">
					${renderedHtml}
				</div>
			`;
			this.bioForm.syncDOMValues();
			this.deckController.updatePositions();
			if (this.lightboxModal.isOpen) {
				this.lightboxModal.renderContent(this.#dom.pagesContainer);
			}
			return;
		}

		let htmlBuffer = "";
		selectedCourses.forEach((course, idx) => {
			const renderedHtml = TemplateRegistry.render(this.#templateDesignKey, course, hasSig, sigSrc);
			htmlBuffer += `
				<div class="deck-card-item" data-index="${idx}" data-code="${course.code}" data-title="${course.title}">
					${renderedHtml}
				</div>
			`;
		});
		this.#dom.pagesContainer.innerHTML = htmlBuffer;

		this.bioForm.syncDOMValues();
		this.deckController.updatePositions();
		if (this.lightboxModal.isOpen) {
			this.lightboxModal.renderContent(this.#dom.pagesContainer);
		}
	}

	#populateDropdowns() {
		if (!this.#dom.templateDesignSelect) return;
		const currentVal = this.#templateDesignKey || "classic";
		this.#dom.templateDesignSelect.innerHTML = "";
		const templates = I18nService.getTemplates();
		templates.forEach((tpl) => {
			const opt = document.createElement("option");
			opt.value = tpl.id;
			opt.textContent = tpl.name;
			if (tpl.id === currentVal) opt.selected = true;
			this.#dom.templateDesignSelect.appendChild(opt);
		});
	}

	#applyTypographyTokens() {
		document.documentElement.style.setProperty("--current-hand-font", this.#handFont);
		if (this.#dom.handFontSelect) this.#dom.handFontSelect.value = this.#handFont;
		document.documentElement.style.setProperty("--current-ink-color", this.#inkColor);

		const templateConfig = {
			"academic-serif": {
				font: "'EB Garamond', 'Source Serif 4', 'Cambria', serif",
				letterSpacing: "0.9px",
				fontSize: "15.5px",
			},
			times: {
				font: "'Times New Roman', Times, 'Liberation Serif', serif",
				letterSpacing: "0.8px",
				fontSize: "15px",
			},
			cinzel: {
				font: "'Cinzel', 'Times New Roman', serif",
				letterSpacing: "1.2px",
				fontSize: "13.5px",
			},
			"modern-sans": {
				font: "'Montserrat', 'Segoe UI', Arial, sans-serif",
				letterSpacing: "0.6px",
				fontSize: "13.5px",
			},
		};

		const activeConf = templateConfig[this.#templateFontKey] || templateConfig["academic-serif"];
		document.documentElement.style.setProperty("--current-template-font", activeConf.font);
		document.documentElement.style.setProperty("--current-label-letter-spacing", activeConf.letterSpacing);
		document.documentElement.style.setProperty("--current-label-font-size", activeConf.fontSize);
		if (this.#dom.templateFontSelect) this.#dom.templateFontSelect.value = this.#templateFontKey;
		if (this.#dom.templateDesignSelect) this.#dom.templateDesignSelect.value = this.#templateDesignKey;
	}

	setInkColor(colorHex, activePill = null) {
		this.#inkColor = colorHex;
		StorageService.set("inkColor", this.#inkColor);
		document.documentElement.style.setProperty("--current-ink-color", this.#inkColor);

		if (this.#dom.colorPalette) {
			this.#dom.colorPalette.querySelectorAll(".color-pill").forEach((p) => p.classList.remove("active"));
			if (activePill) {
				activePill.classList.add("active");
			} else {
				const match = this.#dom.colorPalette.querySelector(`[data-color="${colorHex}"]`);
				if (match) match.classList.add("active");
			}
		}
	}

	#switchStudioTab(tabKey, persist = true) {
		this.#activeStudioTab = tabKey;
		if (persist) {
			StorageService.set("activeStudioTab", tabKey);
		}
		const isCoursesDesign = tabKey === "coursesDesign";
		if (this.#dom.tabBtnCoursesDesign) {
			this.#dom.tabBtnCoursesDesign.classList.toggle("active", isCoursesDesign);
		}
		if (this.#dom.tabBtnStudentBio) {
			this.#dom.tabBtnStudentBio.classList.toggle("active", !isCoursesDesign);
		}
		if (this.#dom.paneCoursesDesign) {
			this.#dom.paneCoursesDesign.classList.toggle("active", isCoursesDesign);
		}
		if (this.#dom.paneStudentBio) {
			this.#dom.paneStudentBio.classList.toggle("active", !isCoursesDesign);
		}
	}

	#toggleMobileSheet(open = null) {
		const isCurrentlyOpen = this.#dom.controlPanel?.classList.contains("mobile-sheet-open");
		const shouldOpen = open !== null ? open : !isCurrentlyOpen;

		if (shouldOpen) {
			this.#dom.controlPanel?.classList.add("mobile-sheet-open");
			this.#dom.mobileSheetBackdrop?.classList.add("active");
			if (this.#dom.sheetChevron) this.#dom.sheetChevron.textContent = "▼";
			document.body.classList.add("mobile-sheet-locked");
		} else {
			this.#dom.controlPanel?.classList.remove("mobile-sheet-open");
			this.#dom.mobileSheetBackdrop?.classList.remove("active");
			if (this.#dom.sheetChevron) this.#dom.sheetChevron.textContent = "▲";
			document.body.classList.remove("mobile-sheet-locked");
		}
	}

	#updateResponsiveScale() {
		const screenW = window.innerWidth;
		if (screenW <= 880) {
			const availableW = screenW - 24;
			const targetBaseW = 794;
			const scale = Math.min(1, Math.max(0.38, availableW / targetBaseW));
			document.documentElement.style.setProperty("--preview-scale", scale.toFixed(3));
		} else {
			document.documentElement.style.setProperty("--preview-scale", "1");
		}
	}
}

// Bootstrap Application on DOM Ready
window.addEventListener("DOMContentLoaded", () => {
	I18nService.init();
	CurriculumStore.init(I18nService.locale);
	window.coversStudioApp = new AssignmentCoversStudioApp();
	window.frontPageApp = window.coversStudioApp;
});

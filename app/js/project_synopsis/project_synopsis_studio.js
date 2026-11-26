/**
 * ProjectSynopsisStudioApp
 * Central orchestrator for the IGNOU Project Synopsis Studio workspace.
 * Single Responsibility: Coordinates Studio Tabs, Document Selector, Project Form,
 * Deck/Sheet Stage Controller, Fullscreen Lightbox Modal, and Document Preview Rendering via ProjectDocRegistry.
 * Zero multiline HTML string literals in JavaScript!
 */
import { StorageService } from "../shared/storage.service.js";
import { I18nService } from "../shared/i18n.service.js";
import { ProjectDocSelector } from "./project_doc_selector.js";
import { ProjectForm } from "./project_form.js";
import { PROJECT_DOCUMENTS } from "../../data/project_programmes.js";
import { ProjectDocRegistry } from "./templates/project_doc_registry.js";
import { DeckStageController } from "../shared/deck_controller.js";
import { StageLightboxModal } from "../shared/lightbox_modal.js";
import { AnalyticsService } from "../shared/analytics.service.js";

export class ProjectSynopsisStudioApp {
	#dom = {};
	#activeTab = "docSelection";
	#isButtonPrintInProgress = false;
	deckController = null;
	lightboxModal = null;
	docSelector = null;
	projectForm = null;

	constructor() {
		this.#initDOM();
		this.#initServices();
		this.#bindEvents();

		// Preload HTML templates and render authentic sheets
		ProjectDocRegistry.preload().then(() => {
			this.renderDocumentSheets();
		});
	}

	#initDOM() {
		this.#dom = {
			tabBtnDocSelection: document.getElementById("tabBtnDocSelection"),
			tabBtnProjectParticulars: document.getElementById("tabBtnProjectParticulars"),
			tabBtnGuideInfo: document.getElementById("tabBtnGuideInfo"),
			tabBtnStudentBio: document.getElementById("tabBtnStudentBio"),
			paneDocSelection: document.getElementById("paneDocSelection"),
			paneProjectParticulars: document.getElementById("paneProjectParticulars"),
			paneGuideInfo: document.getElementById("paneGuideInfo"),
			paneStudentBio: document.getElementById("paneStudentBio"),
			projectPagesContainer: document.getElementById("projectPagesContainer"),
			btnPrint: document.getElementById("btnPrint"),
			btnClear: document.getElementById("btnClear"),
			btnToggleMobileSheet: document.getElementById("btnToggleMobileSheet"),
			btnCloseMobileSheet: document.getElementById("btnCloseMobileSheet"),
			mobileSheetBackdrop: document.getElementById("mobileSheetBackdrop"),
			sheetChevron: document.getElementById("sheetChevron"),
			controlPanel: document.getElementById("controlPanel"),
			secCoverDecoration: document.getElementById("secCoverDecoration"),
			selectCoverBorder: document.getElementById("selectCoverBorder"),
			selectCoverWatermark: document.getElementById("selectCoverWatermark"),
			selectCoverTone: document.getElementById("selectCoverTone"),
			accordionHeader: document.getElementById("accordionHeader"),
			accordionBody: document.getElementById("accordionBody"),
			btnTriggerLightbox: document.getElementById("btnTriggerLightbox"),
		};
	}

	#initServices() {
		I18nService.init();

		this.docSelector = new ProjectDocSelector({
			onSelectionChange: () => {
				this.renderDocumentSheets();
			},
		});

		this.projectForm = new ProjectForm({
			onChange: (fieldName, val) => {
				if (fieldName === "Signature" || fieldName === "GuideSignature") {
					this.renderDocumentSheets();
				} else {
					this.projectForm.syncAllFields();
				}
			},
		});

		// 1. Deck / Sheet Stage Controller (Shared Component)
		this.deckController = new DeckStageController({
			cardsContainer: this.#dom.projectPagesContainer,
			defaultMode: "sheet",
			onActiveChange: (idx) => {
				if (this.lightboxModal?.isOpen) {
					this.lightboxModal.setActiveIndex(idx);
					this.lightboxModal.renderContent(this.#dom.projectPagesContainer);
				}
			},
			onCardClick: (idx) => {
				this.lightboxModal?.open(idx, this.#dom.projectPagesContainer);
			},
		});

		// 2. Fullscreen Lightbox Modal (Shared Component)
		this.lightboxModal = new StageLightboxModal({
			cardsContainer: this.#dom.projectPagesContainer,
			onPageChange: (idx) => {
				this.deckController?.goToIndex(idx);
			},
		});
	}

	#bindEvents() {
		// Studio Tabs (4-Tab Architecture)
		if (this.#dom.tabBtnDocSelection) {
			this.#dom.tabBtnDocSelection.addEventListener("click", () => this.#switchTab("docSelection"));
		}
		if (this.#dom.tabBtnProjectParticulars) {
			this.#dom.tabBtnProjectParticulars.addEventListener("click", () => this.#switchTab("projectParticulars"));
		}
		if (this.#dom.tabBtnGuideInfo) {
			this.#dom.tabBtnGuideInfo.addEventListener("click", () => this.#switchTab("guideInfo"));
		}
		if (this.#dom.tabBtnStudentBio) {
			this.#dom.tabBtnStudentBio.addEventListener("click", () => this.#switchTab("studentBio"));
		}

		// Lightbox Fullscreen Trigger
		if (this.#dom.btnTriggerLightbox) {
			this.#dom.btnTriggerLightbox.addEventListener("click", () => {
				const activeIdx = this.deckController ? this.deckController.activeIndex : 0;
				this.lightboxModal?.open(activeIdx, this.#dom.projectPagesContainer);
			});
		}

		// Accordion
		if (this.#dom.accordionHeader && this.#dom.accordionBody) {
			this.#dom.accordionHeader.addEventListener("click", () => {
				this.#dom.accordionHeader.classList.toggle("open");
				this.#dom.accordionBody.classList.toggle("open");
			});
		}

		// Cover Page Decoration Selectors (Border, Watermark, Paper Tone)
		if (this.#dom.selectCoverBorder) {
			const savedBorder = StorageService.get("project_cover_border", "single");
			this.#dom.selectCoverBorder.value = savedBorder;
			this.#dom.selectCoverBorder.addEventListener("change", (e) => {
				const borderVal = e.target.value;
				StorageService.set("project_cover_border", borderVal);
				this.#applyCoverDecorations();
			});
		}

		if (this.#dom.selectCoverWatermark) {
			const savedWatermark = StorageService.get("project_cover_watermark", "off");
			this.#dom.selectCoverWatermark.value = savedWatermark;
			this.#dom.selectCoverWatermark.addEventListener("change", (e) => {
				const wmVal = e.target.value;
				StorageService.set("project_cover_watermark", wmVal);
				this.#applyCoverDecorations();
			});
		}

		if (this.#dom.selectCoverTone) {
			const savedTone = StorageService.get("project_cover_tone", "white");
			this.#dom.selectCoverTone.value = savedTone;
			this.#dom.selectCoverTone.addEventListener("change", (e) => {
				const toneVal = e.target.value;
				StorageService.set("project_cover_tone", toneVal);
				this.#applyCoverDecorations();
			});
		}

		// Mobile Sheet Toggle
		if (this.#dom.btnToggleMobileSheet) {
			this.#dom.btnToggleMobileSheet.addEventListener("click", () => this.#toggleMobileSheet());
		}
		if (this.#dom.btnCloseMobileSheet) {
			this.#dom.btnCloseMobileSheet.addEventListener("click", () => this.#toggleMobileSheet(false));
		}
		if (this.#dom.mobileSheetBackdrop) {
			this.#dom.mobileSheetBackdrop.addEventListener("click", () => this.#toggleMobileSheet(false));
		}

		// Print button + Ctrl+P beforeprint tracking (guarded to avoid double-counting)
		const trackSelectedSynopsisPrint = () => {
			const selectedDocs = this.docSelector?.checkedDocKeys || StorageService.get("project_selected_docs", []);
			const docKeyMap = new Map(PROJECT_DOCUMENTS.map((d) => [d.id, d.key]));
			const docKeys = Array.from(selectedDocs)
				.map((id) => docKeyMap.get(id) || id)
				.filter(Boolean);
			if (docKeys.length > 0) {
				AnalyticsService.trackSynopsisPrint(docKeys);
			}
		};

		if (this.#dom.btnPrint) {
			this.#dom.btnPrint.addEventListener("click", () => {
				this.#isButtonPrintInProgress = true;
				trackSelectedSynopsisPrint();
				try {
					window.print();
				} finally {
					setTimeout(() => {
						this.#isButtonPrintInProgress = false;
					}, 500);
				}
			});
		}

		window.addEventListener("beforeprint", () => {
			if (!this.#isButtonPrintInProgress) {
				trackSelectedSynopsisPrint();
			}
		});

		// Clear fields
		if (this.#dom.btnClear) {
			this.#dom.btnClear.addEventListener("click", () => {
				this.projectForm.clearAllData();
			});
		}

		// Global Locale Change
		window.addEventListener("app:localeChanged", () => {
			this.docSelector.refreshTranslations();
			this.projectForm.injectSamplePlaceholders();
			this.projectForm.updateSampleToggleButtonUI();
			this.projectForm.syncAllFields();
		});

		// Keyboard Esc to Close Mobile Sheet or Lightbox
		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				if (this.lightboxModal?.isOpen) {
					this.lightboxModal.close();
					return;
				}
				this.#toggleMobileSheet(false);
			}
		});
	}

	#switchTab(tabKey) {
		this.#activeTab = tabKey;
		const isDocs = tabKey === "docSelection";
		const isProject = tabKey === "projectParticulars";
		const isGuide = tabKey === "guideInfo";
		const isStudent = tabKey === "studentBio";

		if (this.#dom.tabBtnDocSelection) this.#dom.tabBtnDocSelection.classList.toggle("active", isDocs);
		if (this.#dom.tabBtnProjectParticulars) this.#dom.tabBtnProjectParticulars.classList.toggle("active", isProject);
		if (this.#dom.tabBtnGuideInfo) this.#dom.tabBtnGuideInfo.classList.toggle("active", isGuide);
		if (this.#dom.tabBtnStudentBio) this.#dom.tabBtnStudentBio.classList.toggle("active", isStudent);

		if (this.#dom.paneDocSelection) this.#dom.paneDocSelection.classList.toggle("active", isDocs);
		if (this.#dom.paneProjectParticulars) this.#dom.paneProjectParticulars.classList.toggle("active", isProject);
		if (this.#dom.paneGuideInfo) this.#dom.paneGuideInfo.classList.toggle("active", isGuide);
		if (this.#dom.paneStudentBio) this.#dom.paneStudentBio.classList.toggle("active", isStudent);
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

	renderDocumentSheets() {
		if (!this.#dom.projectPagesContainer) return;
		this.#dom.projectPagesContainer.innerHTML = "";

		const prog = this.docSelector.selectedProgramme;
		const checkedKeys = this.docSelector.checkedDocKeys;

		// Show Cover Page Decoration section ONLY when Cover Page (Annexure XI) is selected
		if (this.#dom.secCoverDecoration) {
			const isCoverSelected = checkedKeys.has("project_cover");
			this.#dom.secCoverDecoration.style.display = isCoverSelected ? "" : "none";
		}

		const sigData = {
			hasSig: Boolean(this.projectForm.signatureData && this.projectForm.isSignatureIncluded),
			sigSrc: this.projectForm.signatureData || "",
			hasGuideSig: Boolean(this.projectForm.guideSignatureData && this.projectForm.isGuideSignatureIncluded),
			guideSigSrc: this.projectForm.guideSignatureData || "",
		};

		if (checkedKeys.size === 0) {
			this.#dom.projectPagesContainer.innerHTML = `
				<div class="empty-selection-placeholder">
					<span class="empty-icon">📋</span>
					<h3>No Documents Selected</h3>
					<p>Please select at least one document from the sidebar checklist to preview and print.</p>
				</div>
			`;
			if (this.deckController) this.deckController.refresh();
			return;
		}

		let htmlBuffer = "";
		let idx = 0;
		PROJECT_DOCUMENTS.forEach((doc) => {
			if (checkedKeys.has(doc.id)) {
				const renderedDoc = ProjectDocRegistry.render(doc.key, prog, sigData);
				htmlBuffer += `
					<div class="deck-card-item project-preview-card" data-index="${idx}" data-code="${prog.courseCode}" data-title="${doc.name}" data-doc-id="${doc.id}">
						<div class="doc-card-badge">
							<span>${doc.name}</span>
							<span class="badge-code">${prog.courseCode}</span>
						</div>
						${renderedDoc}
					</div>
				`;
				idx++;
			}
		});

		this.#dom.projectPagesContainer.innerHTML = htmlBuffer;
		this.projectForm.syncAllFields();
		this.#applyCoverDecorations();
		if (this.deckController) {
			this.deckController.refresh();
		}
	}

	#applyCoverDecorations() {
		const borderVal = StorageService.get("project_cover_border", "single");
		const wmVal = StorageService.get("project_cover_watermark", "off");
		const toneVal = StorageService.get("project_cover_tone", "white");

		if (this.#dom.selectCoverBorder) {
			this.#dom.selectCoverBorder.value = borderVal;
		}
		if (this.#dom.selectCoverWatermark) {
			this.#dom.selectCoverWatermark.value = wmVal;
		}
		if (this.#dom.selectCoverTone) {
			this.#dom.selectCoverTone.value = toneVal;
		}

		document.querySelectorAll(".tpl-doc-project-cover").forEach((sheet) => {
			sheet.setAttribute("data-border-style", borderVal);
			sheet.setAttribute("data-watermark", wmVal);
			sheet.setAttribute("data-paper-tone", toneVal);
		});
	}
}

// Auto-bootstrap when loaded
document.addEventListener("DOMContentLoaded", () => {
	window.projectSynopsisApp = new ProjectSynopsisStudioApp();
});

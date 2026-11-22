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

export class ProjectSynopsisStudioApp {
	#dom = {};
	#activeTab = "docSelection";
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
			controlPanel: document.getElementById("controlPanel"),
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

		// Print button
		if (this.#dom.btnPrint) {
			this.#dom.btnPrint.addEventListener("click", () => {
				window.print();
			});
		}

		// Clear fields
		if (this.#dom.btnClear) {
			this.#dom.btnClear.addEventListener("click", () => {
				if (confirm("Are you sure you want to clear project & guide particulars?")) {
					["ProjectTitle", "SubjectArea", "GuideName", "GuideDesignation", "GuideAddress", "GuideAddress1", "GuideAddress2", "GuideQualification", "GuideDegree", "GuideExperience", "ProjectSoftware", "FirstSubmission", "SubmissionDate", "GuideDate"].forEach((f) => {
						StorageService.remove("field_" + f);
						const input = document.getElementById("input" + f);
						if (input) input.value = "";
					});
					const defaultDegRadio = document.querySelector('input[name="GuideDegree"][value="phd"]');
					if (defaultDegRadio) defaultDegRadio.checked = true;
					const defaultFirstRadio = document.querySelector('input[name="FirstSubmission"][value="yes"]');
					if (defaultFirstRadio) defaultFirstRadio.checked = true;
					this.projectForm.syncAllFields();
				}
			});
		}

		// Global Locale Change
		window.addEventListener("app:localeChanged", () => {
			this.docSelector.refreshTranslations();
			this.projectForm.injectSamplePlaceholders();
			this.projectForm.updateSampleToggleButtonUI();
			this.projectForm.syncAllFields();
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

	#toggleMobileSheet(forceState = null) {
		if (!this.#dom.controlPanel) return;
		const shouldOpen = forceState !== null ? forceState : !this.#dom.controlPanel.classList.contains("open");
		this.#dom.controlPanel.classList.toggle("open", shouldOpen);
		if (this.#dom.mobileSheetBackdrop) {
			this.#dom.mobileSheetBackdrop.classList.toggle("open", shouldOpen);
		}
	}

	renderDocumentSheets() {
		if (!this.#dom.projectPagesContainer) return;
		this.#dom.projectPagesContainer.innerHTML = "";

		const prog = this.docSelector.selectedProgramme;
		const checkedKeys = this.docSelector.checkedDocKeys;
		const sigData = {
			hasSig: Boolean(this.projectForm.signatureData),
			sigSrc: this.projectForm.signatureData || "",
			hasGuideSig: Boolean(this.projectForm.guideSignatureData),
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
		if (this.deckController) {
			this.deckController.refresh();
		}
	}
}

// Auto-bootstrap when loaded
document.addEventListener("DOMContentLoaded", () => {
	window.projectSynopsisApp = new ProjectSynopsisStudioApp();
});

/**
 * HomeApp
 * Main orchestrator for the IGNOU Doc Automation Hub (index.html).
 * Loads live A4 assignment cover thumbnail, hydrates video card & official PDF,
 * and manages the 16:9 Video Lightbox Modal (Way 3 Implementation).
 */
import { TemplateRegistry } from "../assignment_covers/templates/template_registry.js";
import { I18nService } from "../shared/i18n.service.js";
import { APP_CONFIG, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "../../config.js";

export class HomeApp {
	#dom = {};

	constructor() {
		this.init();
	}

	async init() {
		this.#initDOM();
		I18nService.init();
		await TemplateRegistry.preload(["classic"]);
		this.renderThumbnail();
		this.#hydrateResources();
		this.bindEvents();
	}

	#initDOM() {
		this.#dom = {
			assignmentThumbnailSlot: document.getElementById("assignmentThumbnailSlot"),
			homeVideoThumbImg: document.getElementById("homeVideoThumbImg"),
			linkOfficialPdf: document.getElementById("linkOfficialPdf"),
			btnOpenVideoModal: document.getElementById("btnOpenVideoModal"),
			homeVideoModal: document.getElementById("homeVideoModal"),
			videoModalBackdrop: document.getElementById("videoModalBackdrop"),
			btnCloseVideoModal: document.getElementById("btnCloseVideoModal"),
			btnModalWatchYoutube: document.getElementById("btnModalWatchYoutube"),
			homeModalVideoIframe: document.getElementById("homeModalVideoIframe"),
		};
	}

	renderThumbnail() {
		if (!this.#dom.assignmentThumbnailSlot) return;
		this.#dom.assignmentThumbnailSlot.innerHTML = TemplateRegistry.render("classic");
	}

	#hydrateResources() {
		const videoUrl = APP_CONFIG.videos?.howToUseUrl || "";
		const pdfUrl = APP_CONFIG.references?.mcaProjectGuidelinesPdf || "";

		// 1. Hydrate Video Thumbnail Image
		if (this.#dom.homeVideoThumbImg && videoUrl) {
			const thumbUrl = getYouTubeThumbnailUrl(videoUrl);
			if (thumbUrl) {
				this.#dom.homeVideoThumbImg.src = thumbUrl;
			}
		}

		// 2. Hydrate Official PDF Link
		if (this.#dom.linkOfficialPdf && pdfUrl) {
			this.#dom.linkOfficialPdf.href = pdfUrl;
		}

		// 3. Hydrate Modal External Watch Link
		if (this.#dom.btnModalWatchYoutube && videoUrl) {
			this.#dom.btnModalWatchYoutube.href = videoUrl;
		}
	}

	#openVideoModal() {
		if (!this.#dom.homeVideoModal || !this.#dom.homeModalVideoIframe) return;
		const videoUrl = APP_CONFIG.videos?.howToUseUrl || "";
		const embedUrl = getYouTubeEmbedUrl(videoUrl);

		if (embedUrl) {
			const separator = embedUrl.includes("?") ? "&" : "?";
			this.#dom.homeModalVideoIframe.src = `${embedUrl}${separator}autoplay=1`;
		}

		this.#dom.homeVideoModal.style.display = "flex";
		this.#dom.homeVideoModal.setAttribute("aria-hidden", "false");
		document.body.style.overflow = "hidden";
	}

	#closeVideoModal() {
		if (!this.#dom.homeVideoModal || !this.#dom.homeModalVideoIframe) return;

		// Clear iframe src to immediately halt video and audio playback
		this.#dom.homeModalVideoIframe.src = "";
		this.#dom.homeVideoModal.style.display = "none";
		this.#dom.homeVideoModal.setAttribute("aria-hidden", "true");
		document.body.style.overflow = "";
	}

	bindEvents() {
		// Re-render thumbnail when locale changes
		window.addEventListener("app:localeChanged", () => {
			this.renderThumbnail();
		});

		// Video Lightbox Modal Open Trigger
		if (this.#dom.btnOpenVideoModal) {
			this.#dom.btnOpenVideoModal.addEventListener("click", () => {
				this.#openVideoModal();
			});
			this.#dom.btnOpenVideoModal.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					this.#openVideoModal();
				}
			});
		}

		// Video Lightbox Modal Close Triggers
		if (this.#dom.btnCloseVideoModal) {
			this.#dom.btnCloseVideoModal.addEventListener("click", () => {
				this.#closeVideoModal();
			});
		}

		if (this.#dom.videoModalBackdrop) {
			this.#dom.videoModalBackdrop.addEventListener("click", () => {
				this.#closeVideoModal();
			});
		}

		// Esc Key to Close Modal
		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.#dom.homeVideoModal?.style.display === "flex") {
				this.#closeVideoModal();
			}
		});
	}
}

// Backward compatibility alias
export const DashboardApp = HomeApp;

// Bootstrap HomeApp on DOM ready
window.addEventListener("DOMContentLoaded", () => {
	window.homeApp = new HomeApp();
});

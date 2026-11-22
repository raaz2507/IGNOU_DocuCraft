/**
 * StageLightboxModal
 * Reusable Fullscreen A4 Inspection Lightbox Modal (PDF Reader style).
 * Single Responsibility: Modal presentation, pan, zoom, touch-pinch, and multi-page/multi-card inspection.
 * Usable across Assignment Covers, Project Synopsis, and future IGNOU tools.
 */
export class StageLightboxModal {
	#isOpen = false;
	#zoom = 1.0;
	#panX = 0;
	#panY = 0;
	#isPanning = false;
	#panStartX = 0;
	#panStartY = 0;
	#initialPinchDistance = null;
	#initialPinchZoom = 1.0;
	#activeIndex = 0;
	#cardsContainer = null;
	#dom = {};
	#onPageChangeCallback = null;

	constructor({ onPageChange, cardsContainer = null } = {}) {
		this.#onPageChangeCallback = onPageChange || null;
		this.#cardsContainer = cardsContainer;
		this.#initDOM();
		this.#bindEvents();
	}

	get isOpen() {
		return this.#isOpen;
	}

	get activeIndex() {
		return this.#activeIndex;
	}

	#initDOM() {
		this.#dom = {
			modal: document.getElementById("stageLightboxModal"),
			backdrop: document.getElementById("lightboxBackdrop"),
			closeBtn: document.getElementById("btnCloseLightbox"),
			viewport: document.getElementById("lightboxViewport"),
			sheetHost: document.getElementById("lightboxSheetHost"),
			activeCode: document.getElementById("lightboxActiveCode"),
			activeTitle: document.getElementById("lightboxActiveTitle"),
			pageBadge: document.getElementById("lightboxPageBadge"),
			btnPrev: document.getElementById("btnLightboxPrev"),
			btnNext: document.getElementById("btnLightboxNext"),
			btnZoomIn: document.getElementById("btnLightboxZoomIn"),
			btnZoomOut: document.getElementById("btnLightboxZoomOut"),
			btnZoomReset: document.getElementById("btnLightboxZoomReset"),
			zoomPercent: document.getElementById("lightboxZoomPercent"),
		};
	}

	#bindEvents() {
		if (this.#dom.closeBtn) {
			this.#dom.closeBtn.addEventListener("click", () => this.close());
		}
		if (this.#dom.backdrop) {
			this.#dom.backdrop.addEventListener("click", () => this.close());
		}
		if (this.#dom.btnPrev) {
			this.#dom.btnPrev.addEventListener("click", () => this.prev());
		}
		if (this.#dom.btnNext) {
			this.#dom.btnNext.addEventListener("click", () => this.next());
		}
		if (this.#dom.btnZoomIn) {
			this.#dom.btnZoomIn.addEventListener("click", () => this.stepZoom(1.18));
		}
		if (this.#dom.btnZoomOut) {
			this.#dom.btnZoomOut.addEventListener("click", () => this.stepZoom(0.85));
		}
		if (this.#dom.btnZoomReset) {
			this.#dom.btnZoomReset.addEventListener("click", () => this.resetZoom());
		}

		if (this.#dom.viewport) {
			// Mouse Wheel Zoom
			this.#dom.viewport.addEventListener("wheel", (e) => {
				if (!this.#isOpen) return;
				e.preventDefault();
				const factor = e.deltaY < 0 ? 1.12 : 0.89;
				this.#zoom *= factor;
				this.#applyTransform();
			}, { passive: false });

			// Double Click to Reset Zoom
			this.#dom.viewport.addEventListener("dblclick", (e) => {
				if (e.target.closest("#lightboxBottomNavbar") || e.target.closest("#btnCloseLightbox")) return;
				this.resetZoom();
			});

			// Mouse Drag to Pan
			this.#dom.viewport.addEventListener("mousedown", (e) => {
				if (e.target.closest("#lightboxBottomNavbar") || e.target.closest("#btnCloseLightbox")) return;
				this.#isPanning = true;
				this.#panStartX = e.clientX - this.#panX;
				this.#panStartY = e.clientY - this.#panY;
			});

			// Touch Pinch-to-Zoom & Pan
			this.#dom.viewport.addEventListener("touchstart", (e) => {
				if (e.touches.length === 2) {
					const dx = e.touches[0].clientX - e.touches[1].clientX;
					const dy = e.touches[0].clientY - e.touches[1].clientY;
					this.#initialPinchDistance = Math.hypot(dx, dy);
					this.#initialPinchZoom = this.#zoom;
				} else if (e.touches.length === 1) {
					this.#isPanning = true;
					this.#panStartX = e.touches[0].clientX - this.#panX;
					this.#panStartY = e.touches[0].clientY - this.#panY;
				}
			}, { passive: true });

			this.#dom.viewport.addEventListener("touchmove", (e) => {
				if (e.touches.length === 2 && this.#initialPinchDistance) {
					const dx = e.touches[0].clientX - e.touches[1].clientX;
					const dy = e.touches[0].clientY - e.touches[1].clientY;
					const currentDistance = Math.hypot(dx, dy);
					const scale = currentDistance / this.#initialPinchDistance;
					this.#zoom = this.#initialPinchZoom * scale;
					this.#applyTransform();
				} else if (e.touches.length === 1 && this.#isPanning) {
					this.#panX = e.touches[0].clientX - this.#panStartX;
					this.#panY = e.touches[0].clientY - this.#panStartY;
					this.#applyTransform();
				}
			}, { passive: true });

			this.#dom.viewport.addEventListener("touchend", () => {
				this.#isPanning = false;
				this.#initialPinchDistance = null;
			});
		}

		window.addEventListener("mousemove", (e) => {
			if (!this.#isPanning) return;
			this.#panX = e.clientX - this.#panStartX;
			this.#panY = e.clientY - this.#panStartY;
			this.#applyTransform();
		});

		window.addEventListener("mouseup", () => {
			this.#isPanning = false;
		});

		window.addEventListener("keydown", (e) => {
			if (!this.#isOpen) return;
			if (e.key === "Escape") {
				this.close();
				return;
			}
			if (e.key === "ArrowLeft") {
				this.prev();
			} else if (e.key === "ArrowRight") {
				this.next();
			}
		});
	}

	open(index, cardsContainer = this.#cardsContainer) {
		if (cardsContainer) this.#cardsContainer = cardsContainer;
		const container = this.#cardsContainer;
		const cards = container ? Array.from(container.querySelectorAll(".deck-card-item")) : [];
		if (cards.length === 0) return;

		this.#activeIndex = Math.max(0, Math.min(index, cards.length - 1));
		this.#isOpen = true;

		if (this.#dom.modal) {
			this.#dom.modal.removeAttribute("hidden");
		}
		document.body.classList.add("lightbox-locked");

		this.resetZoom();
		this.renderContent(container);
	}

	close() {
		this.#isOpen = false;
		if (this.#dom.modal) {
			this.#dom.modal.setAttribute("hidden", "");
		}
		document.body.classList.remove("lightbox-locked");
		this.resetZoom();
	}

	resetZoom() {
		this.#zoom = 1.0;
		this.#panX = 0;
		this.#panY = 0;
		this.#applyTransform();
	}

	stepZoom(multiplier) {
		this.#zoom *= multiplier;
		this.#applyTransform();
	}

	#applyTransform() {
		if (!this.#dom.sheetHost) return;
		this.#zoom = Math.max(0.35, Math.min(this.#zoom, 3.2));
		const sheet = this.#dom.sheetHost.querySelector(".page-sheet");
		if (sheet) {
			let baseScale;
			if (window.innerWidth <= 880) {
				const availW = window.innerWidth - 18;
				const availH = window.innerHeight - 80;
				baseScale = Math.min(availW / 793.7, availH / 1122.5);
			} else {
				const availH = window.innerHeight - 90;
				baseScale = Math.min(0.85, Math.max(0.68, availH / 1122.5));
			}

			const totalScale = baseScale * this.#zoom;
			sheet.style.transform = `translate(${this.#panX}px, ${this.#panY}px) scale(${totalScale})`;
		}
		if (this.#dom.zoomPercent) {
			this.#dom.zoomPercent.textContent = `${Math.round(this.#zoom * 100)}%`;
		}
	}

	renderContent(cardsContainer = this.#cardsContainer) {
		if (cardsContainer) this.#cardsContainer = cardsContainer;
		const container = this.#cardsContainer;
		if (!this.#isOpen || !this.#dom.modal || !container) return;

		const cards = Array.from(container.querySelectorAll(".deck-card-item"));
		const total = cards.length;
		if (total === 0) return;

		const activeCard = cards[this.#activeIndex] || cards[0];
		if (!activeCard) return;

		const sheet = activeCard.querySelector(".page-sheet");
		if (sheet && this.#dom.sheetHost) {
			this.#dom.sheetHost.innerHTML = "";
			const cloned = sheet.cloneNode(true);
			this.#dom.sheetHost.appendChild(cloned);
			this.#applyTransform();
		}

		// Update Header Info & Badges
		const code = activeCard.dataset.code || "";
		const title = activeCard.dataset.title || "";
		if (this.#dom.activeCode) this.#dom.activeCode.textContent = code;
		if (this.#dom.activeTitle) this.#dom.activeTitle.textContent = title;
		if (this.#dom.pageBadge) {
			this.#dom.pageBadge.textContent = `Page ${this.#activeIndex + 1} of ${total}`;
		}

		// Update Navigation Buttons
		if (this.#dom.btnPrev) {
			this.#dom.btnPrev.style.opacity = this.#activeIndex === 0 ? "0.35" : "1";
			this.#dom.btnPrev.style.pointerEvents = this.#activeIndex === 0 ? "none" : "auto";
		}
		if (this.#dom.btnNext) {
			this.#dom.btnNext.style.opacity = this.#activeIndex === total - 1 ? "0.35" : "1";
			this.#dom.btnNext.style.pointerEvents = this.#activeIndex === total - 1 ? "none" : "auto";
		}
	}

	prev(cardsContainer = this.#cardsContainer) {
		if (cardsContainer) this.#cardsContainer = cardsContainer;
		if (this.#activeIndex > 0) {
			this.#activeIndex--;
			this.resetZoom();
			this.renderContent(this.#cardsContainer);
			if (this.#onPageChangeCallback) this.#onPageChangeCallback(this.#activeIndex);
		}
	}

	next(cardsContainer = this.#cardsContainer) {
		if (cardsContainer) this.#cardsContainer = cardsContainer;
		const cards = this.#cardsContainer ? this.#cardsContainer.querySelectorAll(".deck-card-item") : [];
		if (this.#activeIndex < cards.length - 1) {
			this.#activeIndex++;
			this.resetZoom();
			this.renderContent(this.#cardsContainer);
			if (this.#onPageChangeCallback) this.#onPageChangeCallback(this.#activeIndex);
		}
	}

	setActiveIndex(index) {
		this.#activeIndex = index;
	}
}

// Backward compatibility alias
export { StageLightboxModal as CoverLightboxModal };

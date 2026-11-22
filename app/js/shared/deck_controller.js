/**
 * DeckStageController
 * Controls the 3D Perspective Coverflow Playing Cards Deck and 1:1 Sheet Inspector.
 * Single Responsibility: 3D perspective layout, depth calculations, swipe gestures, mode switching, and card navigation.
 * Usable across Assignment Covers, Project Synopsis, and future IGNOU tools.
 */
import { StorageService } from "./storage.service.js";
import { I18nService } from "./i18n.service.js";

export class DeckStageController {
	#activeIndex = 0;
	#deckMode = "sheet";
	#currentSheetScale = null;
	#touchStartX = 0;
	#touchStartY = 0;
	#dom = {};
	#onActiveChangeCallback = null;
	#onCardClickCallback = null;

	constructor({ onActiveChange, onCardClick, cardsContainer = null, stageId = "deckStage", viewportId = "deckViewport", defaultMode = "sheet" } = {}) {
		this.#onActiveChangeCallback = onActiveChange || null;
		this.#onCardClickCallback = onCardClick || null;
		this.#deckMode = StorageService.get("deckMode", defaultMode);

		this.#initDOM(stageId, viewportId, cardsContainer);
		this.#bindEvents();
		this.setMode(this.#deckMode, false);
	}

	get activeIndex() {
		return this.#activeIndex;
	}

	get deckMode() {
		return this.#deckMode;
	}

	#initDOM(stageId, viewportId, cardsContainer) {
		const stage = document.getElementById(stageId);
		const viewport = document.getElementById(viewportId);
		const container = cardsContainer || document.getElementById("pagesContainer") || document.getElementById("projectPagesContainer");

		this.#dom = {
			deckStage: stage,
			deckViewport: viewport,
			pagesContainer: container,
			deckActiveCode: document.getElementById("deckActiveCode"),
			deckActiveTitle: document.getElementById("deckActiveTitle"),
			deckCounterBadge: document.getElementById("deckCounterBadge"),
			deckDotsContainer: document.getElementById("deckDotsContainer"),
			btnDeckPrev: document.getElementById("btnDeckPrev"),
			btnDeckNext: document.getElementById("btnDeckNext"),
			btnModeDeck: document.getElementById("btnModeDeck"),
			btnModeSheet: document.getElementById("btnModeSheet"),
		};
	}

	#bindEvents() {
		if (this.#dom.btnDeckPrev) {
			this.#dom.btnDeckPrev.addEventListener("click", () => this.prev());
		}
		if (this.#dom.btnDeckNext) {
			this.#dom.btnDeckNext.addEventListener("click", () => this.next());
		}

		// View Mode Segmented Switch (3D Deck vs 1:1 Sheet)
		if (this.#dom.btnModeDeck) {
			this.#dom.btnModeDeck.addEventListener("click", () => this.setMode("deck"));
		}
		if (this.#dom.btnModeSheet) {
			this.#dom.btnModeSheet.addEventListener("click", () => this.setMode("sheet"));
		}

		// Touch swipe gestures on Viewport
		if (this.#dom.deckViewport) {
			this.#dom.deckViewport.addEventListener("touchstart", (e) => {
				this.#touchStartX = e.touches[0].clientX;
				this.#touchStartY = e.touches[0].clientY;
			}, { passive: true });

			this.#dom.deckViewport.addEventListener("touchend", (e) => {
				const dx = e.changedTouches[0].clientX - this.#touchStartX;
				const dy = e.changedTouches[0].clientY - this.#touchStartY;
				if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
					if (dx < 0) this.next();
					else this.prev();
				}
			}, { passive: true });
		}

		// Card click: Bring side card to center, or trigger active card callback (e.g. lightbox)
		if (this.#dom.pagesContainer) {
			this.#dom.pagesContainer.addEventListener("click", (e) => {
				const card = e.target.closest(".deck-card-item");
				if (card && card.dataset.index !== undefined) {
					const idx = parseInt(card.dataset.index, 10);
					if (idx !== this.#activeIndex) {
						this.goToIndex(idx);
					} else if (this.#onCardClickCallback) {
						this.#onCardClickCallback(idx);
					}
				}
			});
		}

		window.addEventListener("resize", () => {
			this.updateSheetModeScale();
		});
	}

	setMode(modeKey, persist = true) {
		this.#deckMode = modeKey;
		if (persist) {
			StorageService.set("deckMode", modeKey);
		}
		const isSheet = modeKey === "sheet";
		if (this.#dom.btnModeDeck) this.#dom.btnModeDeck.classList.toggle("active", !isSheet);
		if (this.#dom.btnModeSheet) this.#dom.btnModeSheet.classList.toggle("active", isSheet);
		if (this.#dom.deckStage) this.#dom.deckStage.setAttribute("data-deck-mode", modeKey);

		if (isSheet) {
			this.#currentSheetScale = null;
			requestAnimationFrame(() => this.updateSheetModeScale());
		}
		this.updatePositions();
	}

	updateSheetModeScale() {
		if (this.#deckMode !== "sheet") return;
		const viewport = this.#dom.deckViewport;
		const stage = this.#dom.deckStage;
		if (!viewport || !stage) return;

		const a4Width = 793.7;
		const a4Height = 1122.5;
		const isMobile = window.innerWidth <= 880;

		let availableH, availableW;

		if (isMobile) {
			const stageRect = stage.getBoundingClientRect();
			const headerEl = stage.querySelector(".deck-stage-header");
			const footerEl = stage.querySelector(".deck-stage-footer");
			const headerH = headerEl ? headerEl.offsetHeight : 34;
			const footerH = footerEl ? footerEl.offsetHeight : 30;

			availableW = Math.max(260, (stageRect.width || window.innerWidth) - 16);
			const vpRect = viewport.getBoundingClientRect();
			const windowAvailH = Math.max(380, window.innerHeight - 170 - headerH - footerH);
			const stageAvailH = Math.max(380, (stageRect.height || 0) - headerH - footerH - 10);
			const vpH = (vpRect.height > 100) ? (vpRect.height - 8) : 0;
			availableH = Math.max(windowAvailH, stageAvailH, vpH);
		} else {
			const rect = viewport.getBoundingClientRect();
			availableH = Math.max(380, (rect.height || viewport.clientHeight) - 8);
			availableW = Math.max(280, (rect.width || viewport.clientWidth) - 16);
		}

		const scaleByH = availableH / a4Height;
		const scaleByW = availableW / a4Width;
		const finalScale = Math.min(scaleByH, scaleByW);

		if (this.#currentSheetScale !== null && Math.abs(finalScale - this.#currentSheetScale) < 0.002) {
			return;
		}
		this.#currentSheetScale = finalScale;

		const targetCardH = Math.round(a4Height * finalScale);
		const targetCardW = Math.round(a4Width * finalScale);

		document.documentElement.style.setProperty("--sheet-mode-card-h", `${targetCardH}px`);
		document.documentElement.style.setProperty("--sheet-mode-card-w", `${targetCardW}px`);
		document.documentElement.style.setProperty("--sheet-mode-scale", finalScale.toFixed(4));
	}

	updatePositions() {
		if (!this.#dom.pagesContainer) return;
		const cards = Array.from(this.#dom.pagesContainer.querySelectorAll(".deck-card-item"));
		const total = cards.length;
		if (total === 0) return;

		if (this.#activeIndex >= total) this.#activeIndex = total - 1;
		if (this.#activeIndex < 0) this.#activeIndex = 0;

		cards.forEach((card, idx) => {
			const offset = idx - this.#activeIndex;
			card.className = "deck-card-item";

			if (offset === 0) {
				card.classList.add("card-active");
			} else if (offset === -1) {
				card.classList.add("card-left-1");
			} else if (offset === -2) {
				card.classList.add("card-left-2");
			} else if (offset === -3) {
				card.classList.add("card-left-far");
			} else if (offset < -3) {
				card.classList.add("card-hidden");
			} else if (offset === 1) {
				card.classList.add("card-right-1");
			} else if (offset === 2) {
				card.classList.add("card-right-2");
			} else if (offset === 3) {
				card.classList.add("card-right-far");
			} else if (offset > 3) {
				card.classList.add("card-hidden");
			}
		});

		// Update Header Labels
		const activeCard = cards[this.#activeIndex];
		if (activeCard && this.#dom.deckActiveCode && this.#dom.deckActiveTitle) {
			this.#dom.deckActiveCode.textContent = activeCard.dataset.code || "Doc";
			this.#dom.deckActiveTitle.textContent = activeCard.dataset.title || "";
		}
		if (this.#dom.deckCounterBadge) {
			try {
				this.#dom.deckCounterBadge.textContent = I18nService.t("deck.pageCounter", { current: this.#activeIndex + 1, total });
			} catch (_) {
				this.#dom.deckCounterBadge.textContent = `Page ${this.#activeIndex + 1} of ${total}`;
			}
		}

		// Update Navigation Dots
		this.#renderDots(total, cards);

		// Arrow buttons state
		if (this.#dom.btnDeckPrev) {
			this.#dom.btnDeckPrev.style.opacity = this.#activeIndex === 0 ? "0.35" : "1";
			this.#dom.btnDeckPrev.style.pointerEvents = this.#activeIndex === 0 ? "none" : "auto";
		}
		if (this.#dom.btnDeckNext) {
			this.#dom.btnDeckNext.style.opacity = this.#activeIndex === total - 1 ? "0.35" : "1";
			this.#dom.btnDeckNext.style.pointerEvents = this.#activeIndex === total - 1 ? "none" : "auto";
		}

		if (this.#deckMode === "sheet") {
			this.updateSheetModeScale();
		}

		if (this.#onActiveChangeCallback) {
			this.#onActiveChangeCallback(this.#activeIndex);
		}
	}

	#renderDots(total, cards) {
		if (!this.#dom.deckDotsContainer) return;
		let track = this.#dom.deckDotsContainer.querySelector(".deck-dots-track");
		if (!track || track.dataset.total !== String(total)) {
			this.#dom.deckDotsContainer.innerHTML = "";
			track = document.createElement("div");
			track.className = "deck-dots-track";
			track.dataset.total = String(total);

			const pill = document.createElement("div");
			pill.className = "deck-sliding-pill";
			pill.id = "deckSlidingPill";
			track.appendChild(pill);

			cards.forEach((_, idx) => {
				const slot = document.createElement("button");
				slot.type = "button";
				slot.className = "deck-dot-slot";
				slot.setAttribute("aria-label", `Go to document ${idx + 1}`);
				slot.addEventListener("click", () => this.goToIndex(idx));
				track.appendChild(slot);
			});

			this.#dom.deckDotsContainer.appendChild(track);
		}

		const pill = this.#dom.deckDotsContainer.querySelector(".deck-sliding-pill");
		if (pill) {
			const dotWidth = 24;
			pill.style.transform = `translateX(${this.#activeIndex * dotWidth}px)`;
			pill.style.setProperty("--pill-x", `${this.#activeIndex * dotWidth}px`);
		}
	}

	next() {
		const cards = this.#dom.pagesContainer ? this.#dom.pagesContainer.querySelectorAll(".deck-card-item") : [];
		if (this.#activeIndex < cards.length - 1) {
			this.goToIndex(this.#activeIndex + 1);
		}
	}

	prev() {
		if (this.#activeIndex > 0) {
			this.goToIndex(this.#activeIndex - 1);
		}
	}

	goToIndex(index) {
		this.#activeIndex = index;
		this.updatePositions();
	}

	refresh() {
		this.updatePositions();
	}
}

// Backward compatibility alias
export { DeckStageController as CoverDeckController };

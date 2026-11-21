/**
 * FrontPageStudioApp
 * Main application orchestrator for IGNOU Assignment Front Page Studio.
 * Single Responsibility: UI event coordination, DOM state synchronization, and print batching.
 */
import { StorageService } from "../shared/storage.service.js";
import { CurriculumStore } from "../shared/curriculum.store.js";
import { SignatureProcessor } from "../shared/signature.processor.js";
import { TemplateRegistry } from "./templates/index.js";

export class FrontPageStudioApp {
	// Encapsulated Private State Fields
	#theme;
	#checkedCodes;
	#selectedSemView;
	#templateDesignKey;
	#handFont;
	#templateFontKey;
	#inkColor;
	#pageSizeKey;
	#signatureData;
	#signatureScale;
	#persistentFields;
	#dom;
	#mobileActivePageIndex = 0;
	#activeDeckIndex = 0;

	constructor() {
		// Hydrate Encapsulated State from Persistent Storage
		this.#theme = StorageService.get("theme", "light");

		const savedCodes = StorageService.get("checkedCodes", null);
		if (savedCodes !== null && Array.isArray(savedCodes)) {
			this.#checkedCodes = new Set(savedCodes);
		} else {
			this.#checkedCodes = new Set(["MCSL-228", "MCSL-229"]);
		}

		this.#selectedSemView = StorageService.get("semView", "3");
		this.#templateDesignKey = StorageService.get("templateDesignKey", "classic");
		this.#handFont = StorageService.get("handFont", "'Kalam', cursive");
		this.#templateFontKey = StorageService.get("templateFontKey", "academic-serif");
		this.#inkColor = StorageService.get("inkColor", "#0038a8");
		this.#pageSizeKey = StorageService.get("pageSizeKey", "a4");
		this.#signatureData = StorageService.get("signature_webp", null);
		this.#signatureScale = StorageService.get("signature_scale", 1.0);

		this.#persistentFields = ["Enrolment", "Name", "Address1", "Address2", "Programme", "StudyCentre1", "StudyCentre2", "Phone", "Email", "Date"];

		this.#initDOMReferences();
		this.#bindEvents();
		this.#applyTheme();
		this.#restoreProfileData();
		this.#applyTypographyTokens();
		this.#applyPageSize();
		this.#initSignatureState();
		this.#updateResponsiveScale();
		this.#renderCoursesView();
		this.#renderPages();
	}

	/* ------------------------------------------------------------- */
	/* PUBLIC GETTERS (Read-Only Interface)                          */
	/* ------------------------------------------------------------- */
	get theme() {
		return this.#theme;
	}

	get checkedCoursesCount() {
		return this.#checkedCodes.size;
	}

	get checkedCoursesList() {
		return Array.from(this.#checkedCodes);
	}

	/* ------------------------------------------------------------- */
	/* PRIVATE METHODS: DOM Initialization & Event Wiring            */
	/* ------------------------------------------------------------- */
	#initDOMReferences() {
		this.#dom = {
			html: document.documentElement,
			appWorkspace: document.getElementById("appWorkspace"),
			badgeCounter: document.getElementById("badgeCounter"),
			mobileBadgeCounter: document.getElementById("mobileBadgeCounter"),
			btnMobileForm: document.getElementById("btnMobileForm"),
			btnMobilePreview: document.getElementById("btnMobilePreview"),
			accordionHeader: document.getElementById("accordionHeader"),
			accordionBody: document.getElementById("accordionBody"),
			semDropdown: document.getElementById("semDropdown"),
			coursesFullContainer: document.getElementById("coursesFullContainer"),
			templateDesignSelect: document.getElementById("templateDesignSelect"),
			handFontSelect: document.getElementById("handFontSelect"),
			templateFontSelect: document.getElementById("templateFontSelect"),
			pageSizeSelect: document.getElementById("pageSizeSelect"),
			colorPalette: document.getElementById("colorPalette"),
			pagesContainer: document.getElementById("pagesContainer"),
			btnPrint: document.getElementById("btnPrint"),
			btnFillSample: document.getElementById("btnFillSample"),
			btnClear: document.getElementById("btnClear"),
			btnSelectAll: document.getElementById("btnSelectAll"),
			btnInvert: document.getElementById("btnInvert"),
			btnDeselectAll: document.getElementById("btnDeselectAll"),
			inputDate: document.getElementById("inputDate"),
			btnTodayDate: document.getElementById("btnTodayDate"),
			sigFileInput: document.getElementById("sigFileInput"),
			sigPreviewContainer: document.getElementById("sigPreviewContainer"),
			sigPreviewImg: document.getElementById("sigPreviewImg"),
			sigScaleSlider: document.getElementById("sigScaleSlider"),
			sigScaleValue: document.getElementById("sigScaleValue"),
			btnRemoveSig: document.getElementById("btnRemoveSig"),
			dynamicPrintStyle: document.getElementById("dynamicPrintStyle"),
			btnDeckPrev: document.getElementById("btnDeckPrev"),
			btnDeckNext: document.getElementById("btnDeckNext"),
			deckActiveCode: document.getElementById("deckActiveCode"),
			deckActiveTitle: document.getElementById("deckActiveTitle"),
			deckCounterBadge: document.getElementById("deckCounterBadge"),
			deckDotsContainer: document.getElementById("deckDotsContainer"),
		};
	}

	#bindEvents() {
		// Mobile View Switcher (Sticky Bottom Bar)
		if (this.#dom.btnMobileForm && this.#dom.btnMobilePreview) {
			this.#dom.btnMobileForm.addEventListener("click", () => this.#setMobileView("form"));
			this.#dom.btnMobilePreview.addEventListener("click", () => this.#setMobileView("preview"));
		}

		// Accordion Toggle
		this.#dom.accordionHeader.addEventListener("click", () => {
			this.#dom.accordionHeader.classList.toggle("open");
			this.#dom.accordionBody.classList.toggle("open");
		});

		// Semester View Dropdown
		this.#dom.semDropdown.addEventListener("change", (e) => {
			this.#selectedSemView = e.target.value;
			StorageService.set("semView", this.#selectedSemView);
			this.#renderCoursesView();
		});

		// Selection Helpers
		this.#dom.btnSelectAll.addEventListener("click", () => this.selectAllCourses());
		this.#dom.btnInvert.addEventListener("click", () => this.invertCourseSelection());
		this.#dom.btnDeselectAll.addEventListener("click", () => this.deselectAllCourses());

		// Template Design Switcher
		this.#dom.templateDesignSelect.addEventListener("change", (e) => {
			this.#templateDesignKey = e.target.value;
			StorageService.set("templateDesignKey", this.#templateDesignKey);
			this.#renderPages();
		});

		// Typography changes
		this.#dom.handFontSelect.addEventListener("change", (e) => {
			this.#handFont = e.target.value;
			StorageService.set("handFont", this.#handFont);
			this.#applyTypographyTokens();
		});

		this.#dom.templateFontSelect.addEventListener("change", (e) => {
			this.#templateFontKey = e.target.value;
			StorageService.set("templateFontKey", this.#templateFontKey);
			this.#applyTypographyTokens();
		});

		// Printable Paper Size
		this.#dom.pageSizeSelect.addEventListener("change", (e) => {
			this.#pageSizeKey = e.target.value;
			StorageService.set("pageSizeKey", this.#pageSizeKey);
			this.#applyPageSize();
		});

		// Ink Color Event Delegation
		this.#dom.colorPalette.addEventListener("click", (e) => {
			const pill = e.target.closest(".color-pill");
			if (pill) {
				const color = pill.dataset.color;
				this.setInkColor(color, pill);
			}
		});

		// Tactile "Today" Button: Click animation & explicit user fill
		this.#dom.btnTodayDate.addEventListener("click", () => {
			const today = new Date();
			const dateStr = String(today.getDate()).padStart(2, "0") + "/" + String(today.getMonth() + 1).padStart(2, "0") + "/" + today.getFullYear();

			// Set date and sync
			this.#dom.inputDate.value = dateStr;
			this.#syncField("Date", dateStr);

			// Tactile feedback animations
			this.#dom.btnTodayDate.classList.add("clicked-pulse");
			this.#dom.btnTodayDate.textContent = "✓ Today Set!";
			this.#dom.inputDate.classList.add("input-highlight");

			setTimeout(() => {
				this.#dom.btnTodayDate.classList.remove("clicked-pulse");
				this.#dom.btnTodayDate.textContent = "📅 Today";
				this.#dom.inputDate.classList.remove("input-highlight");
			}, 950);
		});

		// Signature Upload & Auto-Processing (via SignatureProcessor)
		this.#dom.sigFileInput.addEventListener("change", async (e) => {
			const file = e.target.files && e.target.files[0];
			if (file) {
				await this.#processSignatureImage(file);
			}
		});

		// Signature Multiplier Scale Slider
		this.#dom.sigScaleSlider.addEventListener("input", (e) => {
			this.#setSignatureScale(parseFloat(e.target.value) || 1.0);
		});

		// Signature Remove Button
		this.#dom.btnRemoveSig.addEventListener("click", () => {
			this.#removeSignature();
		});

		// Student Data Inputs Real-Time Synchronization
		this.#persistentFields.forEach((fieldName) => {
			const input = document.getElementById("input" + fieldName);
			if (input) {
				input.addEventListener("input", () => this.#syncField(fieldName, input.value));
			}
		});

		// Responsive Scaling on Window Resize
		window.addEventListener("resize", () => this.#updateResponsiveScale());

		// Print & Batch Actions
		this.#dom.btnPrint.addEventListener("click", () => window.print());
		this.#dom.btnFillSample.addEventListener("click", () => this.fillSampleData());
		this.#dom.btnClear.addEventListener("click", () => this.clearAllData());

		// 3D Coverflow Navigation Events
		if (this.#dom.btnDeckPrev) {
			this.#dom.btnDeckPrev.addEventListener("click", () => this.#prevDeckCard());
		}
		if (this.#dom.btnDeckNext) {
			this.#dom.btnDeckNext.addEventListener("click", () => this.#nextDeckCard());
		}

		// Click card in 3D fan to bring to center
		if (this.#dom.pagesContainer) {
			this.#dom.pagesContainer.addEventListener("click", (e) => {
				const card = e.target.closest(".deck-card-item");
				if (card && card.dataset.index !== undefined) {
					const idx = parseInt(card.dataset.index, 10);
					if (idx !== this.#activeDeckIndex) {
						this.#activeDeckIndex = idx;
						this.#updateDeckPositions();
					}
				}
			});
		}

		// Keyboard Arrow Navigation
		window.addEventListener("keydown", (e) => {
			const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
			if (activeTag === "input" || activeTag === "select" || activeTag === "textarea") return;

			if (e.key === "ArrowLeft") {
				this.#prevDeckCard();
			} else if (e.key === "ArrowRight") {
				this.#nextDeckCard();
			}
		});
	}

	/* ------------------------------------------------------------- */
	/* THEME MANAGEMENT                                              */
	/* ------------------------------------------------------------- */
	toggleTheme() {
		this.#theme = this.#theme === "light" ? "dark" : "light";
		StorageService.set("theme", this.#theme);
		this.#applyTheme();
	}

	#applyTheme() {
		this.#dom.html.setAttribute("data-theme", this.#theme);

		// Synchronize global header theme toggle if present
		const headerThemeIcon = document.querySelector(".theme-btn-icon");
		const headerThemeText = document.querySelector(".theme-btn-text");
		if (headerThemeIcon) headerThemeIcon.textContent = this.#theme === "dark" ? "☀️" : "🌙";
		if (headerThemeText) headerThemeText.textContent = this.#theme === "dark" ? "Light" : "Dark";
	}

	/* ------------------------------------------------------------- */
	/* TYPOGRAPHY & PRINT PAPER SETUP                                */
	/* ------------------------------------------------------------- */
	#applyTypographyTokens() {
		document.documentElement.style.setProperty("--current-hand-font", this.#handFont);
		this.#dom.handFontSelect.value = this.#handFont;
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
		this.#dom.templateFontSelect.value = this.#templateFontKey;
		this.#dom.templateDesignSelect.value = this.#templateDesignKey;
	}

	#applyPageSize() {
		const paperConfigs = {
			a4: { width: "210mm", height: "297mm", printSize: "A4 portrait" },
			letter: { width: "215.9mm", height: "279.4mm", printSize: "letter portrait" },
			legal: { width: "215.9mm", height: "355.6mm", printSize: "legal portrait" },
			a5: { width: "148mm", height: "210mm", printSize: "A5 portrait" },
		};

		const config = paperConfigs[this.#pageSizeKey] || paperConfigs["a4"];
		document.documentElement.style.setProperty("--page-width", config.width);
		document.documentElement.style.setProperty("--page-height", config.height);

		// Update Dynamic Print Style
		this.#dom.dynamicPrintStyle.textContent = `@page { size: ${config.printSize}; margin: 0; }`;
		this.#dom.pageSizeSelect.value = this.#pageSizeKey;
		this.#updateResponsiveScale();
	}

	setInkColor(colorHex, activePill = null) {
		this.#inkColor = colorHex;
		StorageService.set("inkColor", this.#inkColor);
		document.documentElement.style.setProperty("--current-ink-color", this.#inkColor);

		this.#dom.colorPalette.querySelectorAll(".color-pill").forEach((p) => p.classList.remove("active"));
		if (activePill) {
			activePill.classList.add("active");
		} else {
			const match = this.#dom.colorPalette.querySelector(`[data-color="${colorHex}"]`);
			if (match) match.classList.add("active");
		}
	}

	/* ------------------------------------------------------------- */
	/* MOBILE VIEWPORT AUTO-FIT SCALER                               */
	/* ------------------------------------------------------------- */
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

	/* ------------------------------------------------------------- */
	/* SIGNATURE ENGINE: MULTIPLIER SCALE & ASPECT RATIO CONTROL     */
	/* ------------------------------------------------------------- */
	#initSignatureState() {
		this.#setSignatureScale(this.#signatureScale);
		if (this.#signatureData) {
			this.#dom.sigPreviewImg.src = this.#signatureData;
			this.#dom.sigPreviewContainer.classList.add("visible");
		} else {
			this.#dom.sigPreviewImg.src = "";
			this.#dom.sigPreviewContainer.classList.remove("visible");
		}
	}

	async #processSignatureImage(file) {
		if (!file) return;
		try {
			const webpResult = await SignatureProcessor.process(file);
			this.#signatureData = webpResult;
			StorageService.set("signature_webp", webpResult);
			this.#dom.sigPreviewImg.src = webpResult;
			this.#dom.sigPreviewContainer.classList.add("visible");
			this.#renderPages();
		} catch (err) {
			console.error("Signature processing error:", err);
		}
	}

	#removeSignature() {
		this.#signatureData = null;
		StorageService.remove("signature_webp");
		this.#dom.sigFileInput.value = "";
		this.#dom.sigPreviewImg.src = "";
		this.#dom.sigPreviewContainer.classList.remove("visible");
		this.#renderPages();
	}

	#setSignatureScale(scale) {
		this.#signatureScale = parseFloat(scale) || 1.0;
		StorageService.set("signature_scale", this.#signatureScale);
		document.documentElement.style.setProperty("--sig-scale", this.#signatureScale.toFixed(2));
		this.#dom.sigScaleValue.textContent = `${this.#signatureScale.toFixed(2)}× (${Math.round(this.#signatureScale * 100)}%)`;
		this.#dom.sigScaleSlider.value = this.#signatureScale;
	}

	/* ------------------------------------------------------------- */
	/* COURSE SELECTION & VIEW RENDERING                             */
	/* ------------------------------------------------------------- */
	#renderCoursesView() {
		this.#dom.semDropdown.value = this.#selectedSemView;
		this.#dom.coursesFullContainer.innerHTML = "";

		const semsToDisplay = this.#selectedSemView === "all" ? ["1", "2", "3", "4"] : [this.#selectedSemView];

		semsToDisplay.forEach((semKey) => {
			const semData = CurriculumStore.getSemester(semKey);
			if (!semData) return;

			const groupDiv = document.createElement("div");
			groupDiv.className = "sem-group-box";

			const titleDiv = document.createElement("div");
			titleDiv.className = "sem-group-title";
			titleDiv.innerHTML = `🎓 ${semData.title} <span class="sem-course-count">(${semData.courses.length} Courses)</span>`;
			groupDiv.appendChild(titleDiv);

			const hr = document.createElement("hr");
			hr.className = "sem-divider";
			groupDiv.appendChild(hr);

			semData.courses.forEach((course) => {
				const label = document.createElement("label");
				label.className = "checkbox-item";

				const checkbox = document.createElement("input");
				checkbox.type = "checkbox";
				checkbox.value = course.code;
				checkbox.checked = this.#checkedCodes.has(course.code);
				checkbox.addEventListener("change", () => this.toggleCourse(course.code, checkbox.checked));

				const tag = document.createElement("span");
				tag.className = "course-code-tag";
				tag.textContent = course.code;

				const name = document.createElement("span");
				name.className = "course-name-text";
				name.textContent = course.title;

				label.appendChild(checkbox);
				label.appendChild(tag);
				label.appendChild(name);
				groupDiv.appendChild(label);
			});

			this.#dom.coursesFullContainer.appendChild(groupDiv);
		});

		this.#updateBadgeCounter();
	}

	toggleCourse(code, isChecked) {
		if (isChecked) {
			this.#checkedCodes.add(code);
		} else {
			this.#checkedCodes.delete(code);
		}
		StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		this.#updateBadgeCounter();
		this.#renderPages();
	}

	#getVisibleCodes() {
		if (this.#selectedSemView === "all") {
			return CurriculumStore.getAllCourses().map((c) => c.code);
		}
		return (CurriculumStore.getSemester(this.#selectedSemView)?.courses || []).map((c) => c.code);
	}

	selectAllCourses() {
		const visible = this.#getVisibleCodes();
		visible.forEach((code) => this.#checkedCodes.add(code));
		StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		this.#renderCoursesView();
		this.#renderPages();
	}

	deselectAllCourses() {
		const visible = this.#getVisibleCodes();
		visible.forEach((code) => this.#checkedCodes.delete(code));
		StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		this.#renderCoursesView();
		this.#renderPages();
	}

	invertCourseSelection() {
		const visible = this.#getVisibleCodes();
		visible.forEach((code) => {
			if (this.#checkedCodes.has(code)) {
				this.#checkedCodes.delete(code);
			} else {
				this.#checkedCodes.add(code);
			}
		});
		StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		this.#renderCoursesView();
		this.#renderPages();
	}

	#setMobileView(view) {
		if (!this.#dom.appWorkspace) return;
		this.#dom.appWorkspace.setAttribute("data-mobile-view", view);
		if (view === "form") {
			this.#dom.btnMobileForm?.classList.add("active");
			this.#dom.btnMobilePreview?.classList.remove("active");
		} else {
			this.#dom.btnMobilePreview?.classList.add("active");
			this.#dom.btnMobileForm?.classList.remove("active");
			this.#updateDeckPositions();
		}
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	#updateBadgeCounter() {
		const count = this.#checkedCodes.size;
		this.#dom.badgeCounter.textContent = `${count} ${count === 1 ? "Page" : "Pages"} Ready`;
		if (this.#dom.mobileBadgeCounter) {
			this.#dom.mobileBadgeCounter.textContent = count;
		}
	}

	/* ------------------------------------------------------------- */
	/* A4 PAGES DYNAMIC RENDERING (3D COVERFLOW PLAYING CARDS DECK)  */
	/* ------------------------------------------------------------- */
	#renderPages() {
		this.#dom.pagesContainer.innerHTML = "";
		const allCourses = CurriculumStore.getAllCourses();
		const selectedCourses = allCourses.filter((c) => this.#checkedCodes.has(c.code));

		const hasSig = Boolean(this.#signatureData);
		const sigSrc = hasSig ? this.#signatureData : "";

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
			this.#syncDOMValues();
			this.#updateDeckPositions();
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

		this.#syncDOMValues();
		this.#updateDeckPositions();
	}

	#updateDeckPositions() {
		const cards = Array.from(this.#dom.pagesContainer.querySelectorAll(".deck-card-item"));
		const total = cards.length;
		if (total === 0) return;

		if (this.#activeDeckIndex >= total) this.#activeDeckIndex = total - 1;
		if (this.#activeDeckIndex < 0) this.#activeDeckIndex = 0;

		cards.forEach((card, idx) => {
			const offset = idx - this.#activeDeckIndex;

			// Clean old positional classes
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
		const activeCard = cards[this.#activeDeckIndex];
		if (activeCard && this.#dom.deckActiveCode && this.#dom.deckActiveTitle) {
			this.#dom.deckActiveCode.textContent = activeCard.dataset.code || "Cover";
			this.#dom.deckActiveTitle.textContent = activeCard.dataset.title || "";
		}
		if (this.#dom.deckCounterBadge) {
			this.#dom.deckCounterBadge.textContent = `Page ${this.#activeDeckIndex + 1} of ${total}`;
		}

		// Update Navigation Dots (Sliding Organic Jelly Capsule Indicator)
		if (this.#dom.deckDotsContainer) {
			let track = this.#dom.deckDotsContainer.querySelector(".deck-dots-track");
			if (!track || track.dataset.total !== String(total)) {
				this.#dom.deckDotsContainer.innerHTML = "";
				track = document.createElement("div");
				track.className = "deck-dots-track";
				track.dataset.total = String(total);

				// Create the sliding jelly pill
				const pill = document.createElement("div");
				pill.className = "deck-sliding-pill";
				pill.id = "deckSlidingPill";
				track.appendChild(pill);

				// Create dot slots
				cards.forEach((_, idx) => {
					const slot = document.createElement("button");
					slot.type = "button";
					slot.className = "deck-dot-slot";
					slot.setAttribute("aria-label", `Go to cover ${idx + 1}`);
					slot.addEventListener("click", () => {
						this.#activeDeckIndex = idx;
						this.#updateDeckPositions();
					});
					track.appendChild(slot);
				});

				this.#dom.deckDotsContainer.appendChild(track);
			}

			// Animate sliding pill to new position with organic squash & stretch physics
			const pill = track.querySelector(".deck-sliding-pill");
			if (pill) {
				const slotPitch = 24; // 10px dot + 14px gap
				const targetX = this.#activeDeckIndex * slotPitch;
				const currentPrevX = parseFloat(pill.dataset.x || "0");

				if (targetX !== currentPrevX) {
					pill.style.setProperty("--prev-pill-x", `${currentPrevX}px`);
					pill.style.setProperty("--pill-x", `${targetX}px`);
					pill.dataset.x = String(targetX);

					pill.classList.remove("animating");
					void pill.offsetWidth;
					pill.classList.add("animating");
				} else {
					pill.style.setProperty("--pill-x", `${targetX}px`);
					pill.dataset.x = String(targetX);
				}
			}
		}

		// Arrow buttons state
		if (this.#dom.btnDeckPrev) {
			this.#dom.btnDeckPrev.style.opacity = this.#activeDeckIndex === 0 ? "0.35" : "1";
			this.#dom.btnDeckPrev.style.pointerEvents = this.#activeDeckIndex === 0 ? "none" : "auto";
		}
		if (this.#dom.btnDeckNext) {
			this.#dom.btnDeckNext.style.opacity = this.#activeDeckIndex === total - 1 ? "0.35" : "1";
			this.#dom.btnDeckNext.style.pointerEvents = this.#activeDeckIndex === total - 1 ? "none" : "auto";
		}
	}

	#prevDeckCard() {
		const cards = this.#dom.pagesContainer.querySelectorAll(".deck-card-item");
		if (cards.length <= 1) return;
		if (this.#activeDeckIndex > 0) {
			this.#activeDeckIndex--;
			this.#updateDeckPositions();
		}
	}

	#nextDeckCard() {
		const cards = this.#dom.pagesContainer.querySelectorAll(".deck-card-item");
		if (cards.length <= 1) return;
		if (this.#activeDeckIndex < cards.length - 1) {
			this.#activeDeckIndex++;
			this.#updateDeckPositions();
		}
	}

	/* ------------------------------------------------------------- */
	/* DATA SYNCHRONIZATION & STORAGE                                */
	/* ------------------------------------------------------------- */
	#syncField(fieldName, val) {
		document.querySelectorAll(".val-" + fieldName).forEach((el) => (el.textContent = val));
		StorageService.set("field_" + fieldName, val);
	}

	#syncDOMValues() {
		this.#persistentFields.forEach((fieldName) => {
			const input = document.getElementById("input" + fieldName);
			if (input) {
				const val = input.value;
				document.querySelectorAll(".val-" + fieldName).forEach((el) => (el.textContent = val));
			}
		});
	}

	#restoreProfileData() {
		this.#persistentFields.forEach((fieldName) => {
			const saved = StorageService.get("field_" + fieldName, null);
			const input = document.getElementById("input" + fieldName);
			if (saved !== null && input) {
				input.value = saved;
			}
		});

		this.setInkColor(this.#inkColor);
	}

	fillSampleData() {
		const sampleData = {
			Enrolment: "2105678942",
			Name: "Neha Khan",
			Address1: "House No. 100, B-Block",
			Address2: "Jhangirpuri, New Delhi - 110033",
			Programme: "Master of Computer Applications (MCA_NEW)",
			StudyCentre1: "Sri Guru Tegh Bahadur (SGTB) Khalsa College,",
			StudyCentre2: "(Code: 29069), Delhi- 110007",
			Phone: "+91 9211420240",
			Email: "nehakhan@gmail.com",
			Date: "19/11/2026",
		};

		Object.keys(sampleData).forEach((key) => {
			const input = document.getElementById("input" + key);
			if (input) {
				input.value = sampleData[key];
				this.#syncField(key, sampleData[key]);
			}
		});

		this.#checkedCodes = new Set(["MCSL-228", "MCSL-229"]);
		StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		this.#renderCoursesView();
		this.#renderPages();
	}

	clearAllData() {
		if (!confirm("Are you sure you want to clear all student profile details and course selections?")) return;

		this.#persistentFields.forEach((fieldName) => {
			StorageService.remove("field_" + fieldName);
			const input = document.getElementById("input" + fieldName);
			if (input) input.value = "";
			document.querySelectorAll(".val-" + fieldName).forEach((el) => (el.textContent = ""));
		});

		this.#checkedCodes = new Set();
		StorageService.set("checkedCodes", []);
		this.#removeSignature();
		this.#renderCoursesView();
		this.#renderPages();
	}
}

// Bootstrap Application on DOM Ready with Dynamic Curriculum Fetch
window.addEventListener("DOMContentLoaded", async () => {
	await CurriculumStore.init();
	window.frontPageApp = new FrontPageStudioApp();
});

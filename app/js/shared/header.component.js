/**
 * IgnouHeader Component (Web Component)
 * Single Responsibility: Common Application Top Navigation & Branding.
 * Fully integrated with I18nService (Language Switcher) and Theme coordination.
 */
import { StorageService } from "./storage.service.js";
import { I18nService } from "./i18n.service.js";
import { DataManagerModal } from "./data_manager_modal.js";

export class IgnouHeader extends HTMLElement {
	#isListeningLocale = false;
	#isListeningData = false;

	connectedCallback() {
		this.render();
		this.bindEvents();

		if (!this.#isListeningLocale) {
			window.addEventListener("app:localeChanged", () => {
				this.render();
				this.bindEvents();
			});
			this.#isListeningLocale = true;
		}
	}

	static get observedAttributes() {
		return ["active-page"];
	}

	attributeChangedCallback() {
		this.render();
		this.bindEvents();
	}

	render() {
		// Detect active page from attribute or current pathname
		let activePage = this.getAttribute("active-page");
		if (!activePage) {
			const path = window.location.pathname.toLowerCase();
			if (path.includes("assignment")) activePage = "assignment";
			else if (path.includes("project")) activePage = "project";
			else if (path.includes("help")) activePage = "help";
			else if (path.includes("about")) activePage = "about";
			else activePage = "home";
		}

		const currentLang = I18nService.locale || StorageService.get("app_lang", "en");
		const savedTheme = StorageService.get("theme", "light");
		const isAuto = savedTheme === "auto";

		// Resolve actual visual theme
		let currentTheme = savedTheme;
		if (savedTheme === "auto") {
			const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
			currentTheme = prefersDark ? "dark" : "light";
		}
		document.documentElement.setAttribute("data-theme", currentTheme);

		this.innerHTML = `
		<header class="app-global-header">
			<div class="header-inner">
				<div class="header-brand-zone">
					<a href="./index.html" class="brand-group">
						<div class="brand-logo-badge" aria-hidden="true">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
								<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
								<path d="M12 6v6"/>
								<path d="M9 9h6"/>
							</svg>
						</div>
						<div class="brand-text">
							<span class="brand-title">${I18nService.t("header.brandTitle")}</span>
							<span class="brand-subtitle">${I18nService.t("header.brandSubtitle")}</span>
						</div>
					</a>
				</div>

				<!-- Action Controls (Data Manager + i18n Language Toggle + 2-Section Segmented Theme Switcher) - Top Right -->
				<div class="header-right-actions">
					<button type="button" class="global-action-btn data-pill-btn" id="globalDataToggle" title="${I18nService.t("header.dataTitle") || "Backup & Restore"}" aria-label="Backup & Restore">
						<span class="action-icon">💾</span>
						<span class="action-text">${I18nService.t("header.dataBtn") || "Backup & Restore"}</span>
					</button>

					<button type="button" class="global-action-btn lang-pill-btn" id="globalLangToggle" title="${I18nService.t("header.langTitle")}" aria-label="Language Switcher">
						<span class="action-icon">🌐</span>
						<span class="action-text">${I18nService.t("header.langBtn")}</span>
					</button>

					<!-- Segmented Theme Switcher: Section 1 (Light/Dark) | Section 2 (System Auto) -->
					<div class="theme-segmented-capsule" id="themeSegmentedCapsule" role="group" aria-label="Theme Selection">
						<div class="theme-seg-section theme-manual-group">
							<button type="button" class="theme-seg-btn ${currentTheme === "light" && !isAuto ? "active" : ""}" id="btnThemeLight" data-theme-val="light" title="${I18nService.t("header.themeLight")}" aria-label="Light Theme">
								<span class="icon-mask icon-theme-light" aria-hidden="true"></span>
							</button>
							<button type="button" class="theme-seg-btn ${currentTheme === "dark" && !isAuto ? "active" : ""}" id="btnThemeDark" data-theme-val="dark" title="${I18nService.t("header.themeDark")}" aria-label="Dark Theme">
								<span class="icon-mask icon-theme-dark" aria-hidden="true"></span>
							</button>
						</div>
						<div class="theme-seg-divider" aria-hidden="true"></div>
						<div class="theme-seg-section theme-auto-group">
							<button type="button" class="theme-seg-btn ${isAuto ? "active" : ""}" id="btnThemeAuto" data-theme-val="auto" title="${I18nService.t("header.themeAuto")}" aria-label="Auto System Theme">
								<span class="icon-mask icon-theme-auto" aria-hidden="true"></span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</header>

		<!-- Dedicated Floating Navigation Bar (Outside & Directly Below Header) -->
		<nav class="app-floating-nav-bar" aria-label="Main Navigation">
			<div class="nav-bar-inner">
				<a href="./index.html" class="nav-tab ${activePage === "home" ? "active" : ""}">
					<span class="nav-icon">🏠</span>
					<span class="nav-label">${I18nService.t("header.navHome")}</span>
				</a>
				<a href="./assignment_covers.html" class="nav-tab ${activePage === "assignment" ? "active" : ""}">
					<span class="nav-icon">📑</span>
					<span class="nav-label">${I18nService.t("header.navCovers")}</span>
				</a>
				<a href="./project_synopsis.html" class="nav-tab ${activePage === "project" ? "active" : ""}">
					<span class="nav-icon">🎓</span>
					<span class="nav-label">${I18nService.t("header.navProjectKit")}</span>
				</a>
				<a href="./help.html" class="nav-tab ${activePage === "help" ? "active" : ""}">
					<span class="nav-icon">💡</span>
					<span class="nav-label">${I18nService.t("header.navHelp") || "Help Guide"}</span>
				</a>
				<a href="./about.html" class="nav-tab ${activePage === "about" ? "active" : ""}">
					<span class="nav-icon">ℹ️</span>
					<span class="nav-label">${I18nService.t("header.navAbout") || "About"}</span>
				</a>
			</div>
		</nav>
		`;
	}

	bindEvents() {
		// Project Kit "Coming Soon" Alert/Feedback
		const projectBtn = this.querySelector("#navProjectBtn");
		if (projectBtn) {
			projectBtn.addEventListener("click", () => {
				const currentLang = I18nService.locale;
				const msg = currentLang === "hi" 
					? "🎓 MCA प्रोजेक्ट किट (MCSP-232 प्रोफार्मा एवं प्रमाणपत्र) पर वर्तमान में काम चल रहा है।\n\nकृपया अपने सभी सेमेस्टर्स के लिए 'असाइनमेंट कवर्स स्टूडियो' का उपयोग करें!"
					: "🎓 MCA Project Kit (MCSP-232 Proforma & Certificates) is currently in active development according to SOCIS guidelines.\n\nPlease use the Assignment Covers Studio for your semester courses!";
				alert(msg);
			});
		}

		// 2-Section Segmented Theme Switcher Event Handling
		const applyThemeMode = (mode) => {
			let resolvedTheme = mode;
			if (mode === "auto") {
				const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
				resolvedTheme = prefersDark ? "dark" : "light";
			}
			document.documentElement.setAttribute("data-theme", resolvedTheme);
			StorageService.set("theme", mode);

			// Synchronize active states on buttons
			this.querySelectorAll(".theme-seg-btn").forEach((btn) => {
				const btnVal = btn.dataset.themeVal;
				if (mode === "auto") {
					btn.classList.toggle("active", btnVal === "auto");
				} else {
					btn.classList.toggle("active", btnVal === resolvedTheme);
				}
			});
		};

		this.querySelectorAll(".theme-seg-btn").forEach((btn) => {
			btn.addEventListener("click", () => {
				applyThemeMode(btn.dataset.themeVal);
			});
		});

		// Dynamic OS Theme Preference Listener
		if (window.matchMedia) {
			window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
				const saved = StorageService.get("theme", "light");
				if (saved === "auto") {
					document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
				}
			});
		}

		// Language (i18n) Switcher Event Handler
		const langBtn = this.querySelector("#globalLangToggle");
		if (langBtn) {
			langBtn.addEventListener("click", () => {
				const next = I18nService.locale === "en" ? "hi" : "en";
				I18nService.setLocale(next);
			});
		}

		// Data Manager Modal Event Handler
		const dataBtn = this.querySelector("#globalDataToggle");
		if (dataBtn) {
			dataBtn.addEventListener("click", () => {
				DataManagerModal.open("backup");
			});
		}

		// Global listener for app:openDataManager
		if (!this.#isListeningData) {
			window.addEventListener("app:openDataManager", (e) => {
				const tab = e.detail?.tab || "backup";
				DataManagerModal.open(tab);
			});
			this.#isListeningData = true;
		}
	}
}

if (!customElements.get("ignou-header")) {
	customElements.define("ignou-header", IgnouHeader);
}

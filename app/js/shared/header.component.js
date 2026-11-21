/**
 * IgnouHeader Component (Web Component)
 * Single Responsibility: Common Application Top Navigation & Branding.
 * Reusable across index.html, assignment front page, and project studio.
 * Future-proofed for i18n (Language Switcher) and Theme coordination.
 */
import { StorageService } from "./storage.service.js";

export class IgnouHeader extends HTMLElement {
	connectedCallback() {
		this.render();
		this.bindEvents();
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
			else activePage = "home";
		}

		const currentTheme = StorageService.get("theme", document.documentElement.getAttribute("data-theme") || "light");
		const currentLang = StorageService.get("lang", "en");

		this.innerHTML = `
		<header class="app-global-header">
			<div class="header-inner">
				<div class="header-brand-zone">
					<a href="./index.html" class="brand-group">
						<div class="brand-logo-badge">
							<span class="icon-brand-logo" aria-hidden="true"></span>
						</div>
						<div class="brand-text">
							<span class="brand-title">IGNOU Doc Automation</span>
							<span class="brand-subtitle">Smart Student Workspace</span>
						</div>
					</a>
				</div>

				<!-- Action Controls (i18n Language Toggle + Theme Toggle) - Top Right -->
				<div class="header-right-actions">
					<button type="button" class="global-action-btn lang-pill-btn" id="globalLangToggle" title="Language: English / हिन्दी">
						<span class="action-icon">🌐</span>
						<span class="action-text">${currentLang === "hi" ? "हिन्दी" : "EN"}</span>
					</button>

					<button type="button" class="global-action-btn theme-pill-btn" id="globalThemeToggle" title="Toggle Light/Dark Theme">
						<span class="theme-btn-icon">${currentTheme === "dark" ? "☀️" : "🌙"}</span>
						<span class="theme-btn-text">${currentTheme === "dark" ? "Light" : "Dark"}</span>
					</button>
				</div>
			</div>
		</header>

		<!-- Dedicated Floating Navigation Bar (Outside & Directly Below Header) -->
		<nav class="app-floating-nav-bar" aria-label="Main Navigation">
			<div class="nav-bar-inner">
				<a href="./index.html" class="nav-tab ${activePage === "home" ? "active" : ""}">
					<span class="nav-icon">🏠</span>
					<span class="nav-label">${currentLang === "hi" ? "डैशबोर्ड" : "Dashboard"}</span>
				</a>
				<a href="./ignou_assignment_front_page.html" class="nav-tab ${activePage === "assignment" ? "active" : ""}">
					<span class="nav-icon">📑</span>
					<span class="nav-label">${currentLang === "hi" ? "असाइनमेंट कवर्स" : "Assignment Covers"}</span>
				</a>
				<button type="button" class="nav-tab nav-tab-btn ${activePage === "project" ? "active" : ""}" id="navProjectBtn" title="MCA Project Kit (MCSP-232) - Coming Soon">
					<span class="nav-icon">🎓</span>
					<span class="nav-label">${currentLang === "hi" ? "प्रोजेक्ट किट" : "MCA Project Kit"}</span>
					<span class="nav-status-badge">${currentLang === "hi" ? "शीघ्र" : "Soon"}</span>
				</button>
			</div>
		</nav>
		`;
	}

	bindEvents() {
		// Project Kit "Coming Soon" Alert/Feedback
		const projectBtn = this.querySelector("#navProjectBtn");
		if (projectBtn) {
			projectBtn.addEventListener("click", () => {
				const currentLang = StorageService.get("lang", "en");
				const msg = currentLang === "hi" 
					? "🎓 MCA प्रोजेक्ट किट (MCSP-232 प्रोफार्मा एवं प्रमाणपत्र) पर वर्तमान में काम चल रहा है।\n\nकृपया अपने सभी सेमेस्टर्स के लिए 'असाइनमेंट कवर्स स्टूडियो' का उपयोग करें!"
					: "🎓 MCA Project Kit (MCSP-232 Proforma & Certificates) is currently in active development according to SOCIS guidelines.\n\nPlease use the Assignment Covers Studio for your semester courses!";
				alert(msg);
			});
		}
		// Theme Switcher Event
		const themeBtn = this.querySelector("#globalThemeToggle");
		if (themeBtn) {
			themeBtn.addEventListener("click", () => {
				const current = document.documentElement.getAttribute("data-theme") || "light";
				const next = current === "light" ? "dark" : "light";
				document.documentElement.setAttribute("data-theme", next);
				StorageService.set("theme", next);

				const icon = this.querySelector(".theme-btn-icon");
				const text = this.querySelector(".theme-btn-text");
				if (icon) icon.textContent = next === "dark" ? "☀️" : "🌙";
				if (text) text.textContent = next === "dark" ? "Light" : "Dark";
			});
		}

		// Language (i18n) Switcher Event placeholder
		const langBtn = this.querySelector("#globalLangToggle");
		if (langBtn) {
			langBtn.addEventListener("click", () => {
				const current = StorageService.get("lang", "en");
				const next = current === "en" ? "hi" : "en";
				StorageService.set("lang", next);

				const text = this.querySelector(".action-text");
				if (text) text.textContent = next === "hi" ? "हिन्दी" : "EN";

				window.dispatchEvent(new CustomEvent("ignou-lang-change", { detail: { lang: next } }));
			});
		}
	}
}

if (!customElements.get("ignou-header")) {
	customElements.define("ignou-header", IgnouHeader);
}

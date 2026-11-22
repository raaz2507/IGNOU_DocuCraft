/**
 * I18nService
 * Central Translation Orchestrator for IGNOU Document Automation Hub.
 * Single Responsibility: Synchronous locale switching, reactive DOM attribute translation, and event dispatching.
 */
import { StorageService } from "./storage.service.js";
import { UI_EN } from "../../locales/ui.en.js";
import { UI_HI } from "../../locales/ui.hi.js";
import { SAMPLE_STUDENT_PROFILE_EN } from "../../data/sample_student_data.en.js";
import { SAMPLE_STUDENT_PROFILE_HI } from "../../data/sample_student_data.hi.js";
import { CurriculumStore } from "./curriculum.store.js";
import { TEMPLATES_METADATA_EN, TEMPLATES_METADATA_HI } from "../../data/templates_metadata.js";

export class I18nService {
	static #currentLocale = "en";
	static #dictionaries = {
		en: UI_EN,
		hi: UI_HI,
	};
	static #sampleProfiles = {
		en: SAMPLE_STUDENT_PROFILE_EN,
		hi: SAMPLE_STUDENT_PROFILE_HI,
	};

	/**
	 * Initializes the i18n service from persistent storage.
	 */
	static init() {
		const saved = StorageService.get("app_lang", "en");
		this.#currentLocale = (saved === "hi" || saved === "en") ? saved : "en";
		document.documentElement.setAttribute("lang", this.#currentLocale);
		CurriculumStore.setLocale(this.#currentLocale);
		this.translatePage();
	}

	/**
	 * Returns current active language code ('en' or 'hi').
	 * @returns {string}
	 */
	static get locale() {
		return this.#currentLocale;
	}

	/**
	 * Translates a key path (e.g. 'actions.printAll') with optional parameter interpolation.
	 * @param {string} keyPath - Dot-separated key path
	 * @param {Object} [params] - Key-value replacements for {placeholder}
	 * @returns {string}
	 */
	static t(keyPath, params = {}) {
		const dict = this.#dictionaries[this.#currentLocale] || this.#dictionaries.en;
		const fallbackDict = this.#dictionaries.en;

		let val = keyPath.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), dict);

		if (val === null || val === undefined) {
			val = keyPath.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), fallbackDict);
		}

		if (typeof val !== "string") return keyPath;

		// Perform {param} interpolation
		return val.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
	}

	/**
	 * Sets and persists new locale, updating curriculum, sample profiles, and DOM.
	 * @param {string} newLocale - 'en' or 'hi'
	 */
	static setLocale(newLocale) {
		const target = newLocale === "hi" ? "hi" : "en";
		if (this.#currentLocale === target) return;

		this.#currentLocale = target;
		StorageService.set("app_lang", target);
		document.documentElement.setAttribute("lang", target);

		// Synchronize Curriculum Store
		CurriculumStore.setLocale(target);

		// Reactive full-page DOM translation
		this.translatePage();

		// Notify all reactive components
		window.dispatchEvent(
			new CustomEvent("app:localeChanged", {
				detail: { lang: target },
			})
		);
	}

	/**
	 * Returns the locale-matching Sample Student Profile data.
	 * @returns {Object}
	 */
	static getSampleProfile() {
		return this.#sampleProfiles[this.#currentLocale] || this.#sampleProfiles.en;
	}

	/**
	 * Returns translated template metadata list for active locale.
	 * @returns {Array<{id: string, name: string, description: string, tag: string}>}
	 */
	static getTemplates() {
		return this.#currentLocale === "hi" ? TEMPLATES_METADATA_HI : TEMPLATES_METADATA_EN;
	}

	/**
	 * Scans DOM for [data-i18n] and [data-i18n-attr] and updates their content immediately.
	 * Format for [data-i18n-attr]: "placeholder:form.namePlaceholder;title:actions.sampleGuide"
	 */
	static translatePage(root = document) {
		// 1. Element text translations
		const elements = root.querySelectorAll("[data-i18n]");
		elements.forEach((el) => {
			const key = el.getAttribute("data-i18n");
			if (key) {
				el.textContent = this.t(key);
			}
		});

		// 2. Element attribute translations (placeholder, title, aria-label)
		const attrElements = root.querySelectorAll("[data-i18n-attr]");
		attrElements.forEach((el) => {
			const rawMap = el.getAttribute("data-i18n-attr");
			if (!rawMap) return;

			rawMap.split(";").forEach((pair) => {
				const [attr, key] = pair.split(":").map((s) => s.trim());
				if (attr && key) {
					el.setAttribute(attr, this.t(key));
				}
			});
		});
	}
}

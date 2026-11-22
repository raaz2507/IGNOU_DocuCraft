/**
 * Assignment Covers Template Registry / Hydration Engine
 * Single Responsibility: Loads independent HTML template files (app/templates/assignment_covers/cover_*.template.html),
 * caches their <template> elements in memory, and hydrates them with student/course data.
 * Zero multiline HTML string literals in JavaScript!
 */

// Module-level private in-memory cache for parsed templates
const templateCache = new Map();

export const TemplateRegistry = {
	/**
	 * Preloads template HTML files into memory from app/templates/assignment_covers/.
	 * @param {string[]} keys - List of template keys to preload (e.g. ['classic', 'modern', 'gazette', 'portfolio'])
	 * @returns {Promise<void>}
	 */
	async preload(keys = ["classic", "modern", "gazette", "portfolio"]) {
		const loadPromises = keys.map(async (key) => {
			if (templateCache.has(key)) return;
			try {
				const response = await fetch(`./templates/assignment_covers/cover_${key}.template.html`);
				if (!response.ok) {
					console.warn(`[TemplateRegistry] Failed to fetch ./templates/assignment_covers/cover_${key}.template.html: HTTP ${response.status}`);
					return;
				}
				const htmlText = await response.text();
				const parser = new DOMParser();
				const doc = parser.parseFromString(htmlText, "text/html");
				const templateEl = doc.querySelector("template");
				if (templateEl) {
					templateCache.set(key, templateEl);
				} else {
					console.error(`[TemplateRegistry] No <template> element found in ./templates/assignment_covers/cover_${key}.template.html`);
				}
			} catch (err) {
				console.error(`[TemplateRegistry] Error loading ./templates/assignment_covers/cover_${key}.template.html:`, err);
			}
		});

		await Promise.all(loadPromises);
	},

	/**
	 * Retrieves the template element for a given key from memory cache or DOM fallback.
	 * @param {string} templateKey
	 * @returns {HTMLTemplateElement|null}
	 */
	getTemplate(templateKey) {
		const key = templateKey || "classic";
		// 1. Check in-memory preloaded cache
		if (templateCache.has(key)) {
			return templateCache.get(key);
		}
		// 2. Fallback to DOM if embedded directly
		const domTpl = document.getElementById("tpl-" + key) || document.getElementById("tpl-classic");
		if (domTpl) {
			templateCache.set(key, domTpl);
			return domTpl;
		}
		// 3. Fallback to classic from cache
		return templateCache.get("classic") || null;
	},

	/**
	 * Renders an A4 Cover Page by cloning its native HTML5 <template>.
	 * @param {string} templateKey - 'classic', 'modern', 'gazette', or 'portfolio'
	 * @param {Object|null} course - Optional: { code, title, assign }. If null/omitted, renders authentic blank template.
	 * @param {boolean} hasSig - whether user uploaded a signature
	 * @param {string} sigSrc - base64/blob signature image URL
	 * @returns {string} - Rendered HTML string ready for deck/thumbnail injection
	 */
	render(templateKey, course = null, hasSig = false, sigSrc = "") {
		const tplEl = this.getTemplate(templateKey);

		if (!tplEl) {
			console.error(`[TemplateRegistry] Template "${templateKey}" not available.`);
			return "";
		}

		// 1. Native DOM DocumentFragment clone (Zero string overhead)
		const clone = tplEl.content.cloneNode(true);
		const article = clone.querySelector(".page-sheet");

		if (article) {
			article.setAttribute("data-course", course?.code || "");
			if (hasSig) {
				article.classList.add("has-signature");
			} else {
				article.classList.remove("has-signature");
			}
		}

		// 2. Hydrate Course Particulars ONLY if course data is provided
		if (course) {
			const titleEl = clone.querySelector(".val-CourseTitle");
			if (titleEl) titleEl.textContent = course.title || "";

			const codeEl = clone.querySelector(".val-CourseCode");
			if (codeEl) codeEl.textContent = course.code || "";

			const assignEl = clone.querySelector(".val-AssignmentNo");
			if (assignEl) assignEl.textContent = course.assign || "";
		}

		// 3. Hydrate Signature Image
		const sigImg = clone.querySelector(".val-SignatureImg");
		if (sigImg) {
			if (hasSig && sigSrc) {
				sigImg.src = sigSrc;
				sigImg.style.display = "block";
			} else {
				sigImg.src = "";
				sigImg.style.display = "none";
			}
		}

		// 4. Return serialized markup for the card container
		const wrapper = document.createElement("div");
		wrapper.appendChild(clone);
		return wrapper.innerHTML;
	},
};

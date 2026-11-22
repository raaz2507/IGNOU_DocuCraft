/**
 * Project Document Template Registry / Hydration Engine
 * Single Responsibility: Loads independent HTML template files from app/templates/project_synopsis/,
 * caches their <template> elements in memory, and hydrates them with student & project data.
 * Zero multiline HTML string literals in JavaScript!
 */

const templateCache = new Map();

export const ProjectDocRegistry = {
	/**
	 * Preloads template HTML files into memory from app/templates/project_synopsis/.
	 * @param {string[]} docKeys - List of template keys to preload (e.g. ['doc_proforma', 'doc_trainee_letter', 'doc_originality', 'doc_project_cover'])
	 * @returns {Promise<void>}
	 */
	async preload(docKeys = ["doc_proforma", "doc_trainee_letter", "doc_originality", "doc_project_cover"]) {
		const loadPromises = docKeys.map(async (key) => {
			if (templateCache.has(key)) return;
			try {
				const response = await fetch(`./templates/project_synopsis/${key}.template.html`);
				if (!response.ok) {
					console.warn(`[ProjectDocRegistry] Failed to fetch ./templates/project_synopsis/${key}.template.html: HTTP ${response.status}`);
					return;
				}
				const htmlText = await response.text();
				const parser = new DOMParser();
				const doc = parser.parseFromString(htmlText, "text/html");
				const templateEl = doc.querySelector("template");
				if (templateEl) {
					templateCache.set(key, templateEl);
				} else {
					console.error(`[ProjectDocRegistry] No <template> element found in ./templates/project_synopsis/${key}.template.html`);
				}
			} catch (err) {
				console.error(`[ProjectDocRegistry] Error loading ./templates/project_synopsis/${key}.template.html:`, err);
			}
		});

		await Promise.all(loadPromises);
	},

	/**
	 * Retrieves the template element for a given key.
	 * @param {string} key
	 * @returns {HTMLTemplateElement|null}
	 */
	getTemplate(key) {
		if (templateCache.has(key)) {
			return templateCache.get(key);
		}
		const domTpl = document.getElementById("tpl-" + key.replace(/_/g, "-"));
		if (domTpl) {
			templateCache.set(key, domTpl);
			return domTpl;
		}
		return null;
	},

	/**
	 * Renders a document sheet by cloning its native HTML5 <template>.
	 * @param {string} docKey - 'doc_proforma', 'doc_trainee_letter', etc.
	 * @param {Object} programme - Programme details { code, title, courseCode, school, degreeName }
	 * @param {Object|boolean} sigData - { hasSig, sigSrc, hasGuideSig, guideSigSrc } or hasSig
	 * @param {string} sigSrcFallback - Base64/blob signature URL
	 * @returns {string} - Rendered HTML string
	 */
	render(docKey, programme, sigData = {}, sigSrcFallback = "") {
		const tplEl = this.getTemplate(docKey);
		if (!tplEl) {
			console.warn(`[ProjectDocRegistry] Template "${docKey}" not found in cache.`);
			return "";
		}

		const hasSig = typeof sigData === "object" ? Boolean(sigData?.hasSig) : Boolean(sigData);
		const sigSrc = typeof sigData === "object" ? (sigData?.sigSrc || "") : (sigSrcFallback || "");
		const hasGuideSig = typeof sigData === "object" ? Boolean(sigData?.hasGuideSig) : false;
		const guideSigSrc = typeof sigData === "object" ? (sigData?.guideSigSrc || "") : "";

		const clone = tplEl.content.cloneNode(true);
		const article = clone.querySelector(".page-sheet");

		if (article) {
			article.setAttribute("data-doc-key", docKey);
			article.setAttribute("data-course", programme?.courseCode || "");
			if (hasSig) article.classList.add("has-signature");
			else article.classList.remove("has-signature");
		}

		// Inject dynamic Programme variables
		if (programme) {
			const progTitleCode = (programme.code === "MCA_NEW" || programme.code === "MCA") ? "MCA" : programme.code;
			const courseCodeSpaced = (programme.courseCode || "").replace(/([A-Za-z]+)-(\d+)/, "$1 - $2");
			clone.querySelectorAll(".val-ProgrammeCode").forEach((el) => (el.textContent = progTitleCode));
			clone.querySelectorAll(".val-ProgrammeTitle").forEach((el) => (el.textContent = programme.title));
			clone.querySelectorAll(".val-CourseCode").forEach((el) => (el.textContent = programme.courseCode));
			clone.querySelectorAll(".val-CourseCodeSpaced").forEach((el) => (el.textContent = courseCodeSpaced));
			clone.querySelectorAll(".val-SchoolName").forEach((el) => (el.textContent = programme.school.toUpperCase()));
			clone.querySelectorAll(".val-SchoolTitleCase").forEach((el) => (el.textContent = programme.school));
			clone.querySelectorAll(".val-DegreeName").forEach((el) => (el.textContent = programme.degreeName));
			clone.querySelectorAll(".val-ProgrammeTitleCase").forEach((el) => (el.textContent = programme.title));
			clone.querySelectorAll(".val-ProgrammeShortCode").forEach((el) => (el.textContent = progTitleCode));
			clone.querySelectorAll(".val-ProgrammeWithShortCode").forEach((el) => (el.textContent = `${programme.title} (${progTitleCode})`));
		}

		// Inject student signature image if present
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

		// Inject guide signature image if present
		const guideSigImg = clone.querySelector(".val-GuideSignatureImg");
		if (guideSigImg) {
			if (hasGuideSig && guideSigSrc) {
				guideSigImg.src = guideSigSrc;
				guideSigImg.style.display = "block";
			} else {
				guideSigImg.src = "";
				guideSigImg.style.display = "none";
			}
		}

		const wrapper = document.createElement("div");
		wrapper.appendChild(clone);
		return wrapper.innerHTML;
	},
};

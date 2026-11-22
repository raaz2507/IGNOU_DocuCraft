/**
 * ProjectDocSelector Component
 * Single Responsibility: Manages Programme selection (MCA_NEW / BCA / PGDCA) and Document checkboxes (Annexures II, X, XI, Trainee Letter).
 */
import { PROJECT_PROGRAMMES, PROJECT_DOCUMENTS } from "../../data/project_programmes.js";
import { StorageService } from "../shared/storage.service.js";
import { I18nService } from "../shared/i18n.service.js";

export class ProjectDocSelector {
	#selectedProgrammeCode = "MCA_NEW";
	#checkedDocKeys = new Set();
	#dom = {};
	#onSelectionChangeCallback = null;

	constructor({ onSelectionChange } = {}) {
		this.#onSelectionChangeCallback = onSelectionChange || null;
		this.#selectedProgrammeCode = StorageService.get("project_programme", "MCA_NEW");
		
		const savedDocs = StorageService.get("project_selected_docs", null);
		if (Array.isArray(savedDocs) && savedDocs.length > 0) {
			this.#checkedDocKeys = new Set(savedDocs);
		} else {
			PROJECT_DOCUMENTS.forEach((doc) => {
				if (doc.defaultChecked) this.#checkedDocKeys.add(doc.id);
			});
		}

		this.#initDOM();
		this.#populateProgrammes();
		this.#renderDocCheckboxes();
		this.#bindEvents();
	}

	get selectedProgramme() {
		return PROJECT_PROGRAMMES.find((p) => p.code === this.#selectedProgrammeCode) || PROJECT_PROGRAMMES[0];
	}

	get checkedDocKeys() {
		return this.#checkedDocKeys;
	}

	#initDOM() {
		this.#dom = {
			selectProgramme: document.getElementById("selectProgramme"),
			projectDocsList: document.getElementById("projectDocsList"),
			btnSelectAllDocs: document.getElementById("btnSelectAllDocs"),
			btnDeselectAllDocs: document.getElementById("btnDeselectAllDocs"),
			badgeCounter: document.getElementById("badgeCounter"),
		};
	}

	#populateProgrammes() {
		if (!this.#dom.selectProgramme) return;
		this.#dom.selectProgramme.innerHTML = "";

		PROJECT_PROGRAMMES.forEach((p) => {
			const opt = document.createElement("option");
			opt.value = p.code;
			opt.textContent = `${p.code} - ${p.title} (${p.courseCode})`;
			if (p.code === this.#selectedProgrammeCode) opt.selected = true;
			this.#dom.selectProgramme.appendChild(opt);
		});
	}

	#renderDocCheckboxes() {
		if (!this.#dom.projectDocsList) return;
		this.#dom.projectDocsList.innerHTML = "";

		const isHindi = I18nService.locale === "hi";

		PROJECT_DOCUMENTS.forEach((doc) => {
			const isChecked = this.#checkedDocKeys.has(doc.id);
			const label = isHindi && doc.nameHindi ? doc.nameHindi : doc.name;

			const row = document.createElement("label");
			row.className = "checkbox-item-row";
			row.htmlFor = `chk_doc_${doc.id}`;

			row.innerHTML = `
				<input type="checkbox" id="chk_doc_${doc.id}" data-doc-id="${doc.id}" class="custom-checkbox" ${isChecked ? "checked" : ""}>
				<div class="checkbox-text-group">
					<span class="checkbox-main-title">${label}</span>
					<span class="checkbox-sub-title">${doc.sub}</span>
				</div>
			`;

			const input = row.querySelector("input");
			input.addEventListener("change", (e) => {
				if (e.target.checked) {
					this.#checkedDocKeys.add(doc.id);
				} else {
					this.#checkedDocKeys.delete(doc.id);
				}
				this.#persistAndNotify();
			});

			this.#dom.projectDocsList.appendChild(row);
		});

		this.#updateBadgeCounter();
	}

	#bindEvents() {
		if (this.#dom.selectProgramme) {
			this.#dom.selectProgramme.addEventListener("change", (e) => {
				this.#selectedProgrammeCode = e.target.value;
				StorageService.set("project_programme", this.#selectedProgrammeCode);
				this.#persistAndNotify();
			});
		}

		if (this.#dom.btnSelectAllDocs) {
			this.#dom.btnSelectAllDocs.addEventListener("click", () => {
				PROJECT_DOCUMENTS.forEach((d) => this.#checkedDocKeys.add(d.id));
				this.#updateDOMCheckboxes(true);
				this.#persistAndNotify();
			});
		}

		if (this.#dom.btnDeselectAllDocs) {
			this.#dom.btnDeselectAllDocs.addEventListener("click", () => {
				this.#checkedDocKeys.clear();
				this.#updateDOMCheckboxes(false);
				this.#persistAndNotify();
			});
		}

		window.addEventListener("app:dataRestored", () => {
			this.#selectedProgrammeCode = StorageService.get("project_programme", "MCA_NEW");
			const savedDocs = StorageService.get("project_selected_docs", null);
			if (Array.isArray(savedDocs)) {
				this.#checkedDocKeys = new Set(savedDocs);
			}
			this.#populateProgrammes();
			this.#renderDocCheckboxes();
			this.#updateBadgeCounter();
			if (this.#onSelectionChangeCallback) {
				this.#onSelectionChangeCallback(this.selectedProgramme, Array.from(this.#checkedDocKeys));
			}
		});
	}

	#updateDOMCheckboxes(checked) {
		if (!this.#dom.projectDocsList) return;
		this.#dom.projectDocsList.querySelectorAll("input[type='checkbox']").forEach((chk) => {
			chk.checked = checked;
		});
	}

	#persistAndNotify() {
		StorageService.set("project_selected_docs", Array.from(this.#checkedDocKeys));
		this.#updateBadgeCounter();
		if (this.#onSelectionChangeCallback) {
			this.#onSelectionChangeCallback(this.selectedProgramme, Array.from(this.#checkedDocKeys));
		}
	}

	#updateBadgeCounter() {
		if (!this.#dom.badgeCounter) return;
		const count = this.#checkedDocKeys.size;
		this.#dom.badgeCounter.textContent = `${count} Doc${count === 1 ? "" : "s"} Selected`;
	}

	refreshTranslations() {
		this.#populateProgrammes();
		this.#renderDocCheckboxes();
	}
}

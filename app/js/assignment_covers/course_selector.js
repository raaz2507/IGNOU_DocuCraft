/**
 * CourseSelector
 * Manages curriculum semester filtering, course selection checkboxes, and selection counters.
 * Single Responsibility: Course selection state, semester grouping, and batch selection operations.
 */
import { StorageService } from "../shared/storage.service.js";
import { CurriculumStore } from "../shared/curriculum.store.js";
import { I18nService } from "../shared/i18n.service.js";

export class CourseSelector {
	#checkedCodes;
	#selectedSemView;
	#dom = {};
	#onSelectionChangeCallback = null;

	constructor({ onSelectionChange } = {}) {
		this.#onSelectionChangeCallback = onSelectionChange || null;

		const savedCodes = StorageService.get("checkedCodes", null);
		if (savedCodes !== null && Array.isArray(savedCodes)) {
			this.#checkedCodes = new Set(savedCodes);
		} else {
			this.#checkedCodes = new Set(["MCSL-228", "MCSL-229"]);
			StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		}

		this.#selectedSemView = StorageService.get("semView", "3");

		this.#initDOM();
		this.#bindEvents();
		this.populateSemDropdown();
		this.renderCoursesView();
	}

	get checkedCodes() {
		return this.#checkedCodes;
	}

	get checkedCount() {
		return this.#checkedCodes.size;
	}

	get checkedList() {
		return Array.from(this.#checkedCodes);
	}

	get selectedSemView() {
		return this.#selectedSemView;
	}

	#initDOM() {
		this.#dom = {
			semDropdown: document.getElementById("semDropdown"),
			coursesFullContainer: document.getElementById("coursesFullContainer"),
			btnSelectAll: document.getElementById("btnSelectAll"),
			btnInvert: document.getElementById("btnInvert"),
			btnDeselectAll: document.getElementById("btnDeselectAll"),
			badgeCounter: document.getElementById("badgeCounter"),
			mobileBadgeCounter: document.getElementById("mobileBadgeCounter"),
		};
	}

	#bindEvents() {
		if (this.#dom.semDropdown) {
			this.#dom.semDropdown.addEventListener("change", (e) => {
				this.#selectedSemView = e.target.value;
				StorageService.set("semView", this.#selectedSemView);
				this.renderCoursesView();
			});
		}

		if (this.#dom.btnSelectAll) {
			this.#dom.btnSelectAll.addEventListener("click", () => this.selectAllCourses());
		}
		if (this.#dom.btnInvert) {
			this.#dom.btnInvert.addEventListener("click", () => this.invertCourseSelection());
		}
		if (this.#dom.btnDeselectAll) {
			this.#dom.btnDeselectAll.addEventListener("click", () => this.deselectAllCourses());
		}

		window.addEventListener("app:dataRestored", () => {
			const savedCodes = StorageService.get("checkedCodes", null);
			if (savedCodes !== null && Array.isArray(savedCodes)) {
				this.#checkedCodes = new Set(savedCodes);
			}
			this.#selectedSemView = StorageService.get("semView", "3");
			this.populateSemDropdown();
			this.renderCoursesView();
			if (this.#onSelectionChangeCallback) this.#onSelectionChangeCallback(Array.from(this.#checkedCodes));
		});
	}

	populateSemDropdown() {
		if (!this.#dom.semDropdown) return;
		const currentSem = this.#selectedSemView || "all";
		this.#dom.semDropdown.innerHTML = "";

		const allOpt = document.createElement("option");
		allOpt.value = "all";
		allOpt.textContent = I18nService.t("coursesTab.allSemestersOption");
		if (currentSem === "all") allOpt.selected = true;
		this.#dom.semDropdown.appendChild(allOpt);

		const sems = ["1", "2", "3", "4"];
		sems.forEach((semKey) => {
			const semData = CurriculumStore.getSemester(semKey);
			if (semData) {
				const opt = document.createElement("option");
				opt.value = semKey;
				opt.textContent = `${semData.title} (${semData.courses.length} ${I18nService.t("coursesTab.coursesCountLabel")})`;
				if (semKey === currentSem) opt.selected = true;
				this.#dom.semDropdown.appendChild(opt);
			}
		});
	}

	renderCoursesView() {
		if (!this.#dom.coursesFullContainer) return;
		if (this.#dom.semDropdown) this.#dom.semDropdown.value = this.#selectedSemView;
		this.#dom.coursesFullContainer.innerHTML = "";

		const semsToDisplay = this.#selectedSemView === "all" ? ["1", "2", "3", "4"] : [this.#selectedSemView];

		semsToDisplay.forEach((semKey) => {
			const semData = CurriculumStore.getSemester(semKey);
			if (!semData) return;

			const groupDiv = document.createElement("div");
			groupDiv.className = "sem-group-box";

			const titleDiv = document.createElement("div");
			titleDiv.className = "sem-group-title";
			const countLabel = I18nService.t("coursesTab.coursesCountLabel");
			titleDiv.innerHTML = `🎓 ${semData.title} <span class="sem-course-count">(${semData.courses.length} ${countLabel})</span>`;
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

		this.updateBadgeCounter();
	}

	toggleCourse(code, isChecked) {
		if (isChecked) {
			this.#checkedCodes.add(code);
		} else {
			this.#checkedCodes.delete(code);
		}
		StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		this.updateBadgeCounter();
		if (this.#onSelectionChangeCallback) this.#onSelectionChangeCallback();
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
		this.renderCoursesView();
		if (this.#onSelectionChangeCallback) this.#onSelectionChangeCallback();
	}

	deselectAllCourses() {
		const visible = this.#getVisibleCodes();
		visible.forEach((code) => this.#checkedCodes.delete(code));
		StorageService.set("checkedCodes", Array.from(this.#checkedCodes));
		this.renderCoursesView();
		if (this.#onSelectionChangeCallback) this.#onSelectionChangeCallback();
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
		this.renderCoursesView();
		if (this.#onSelectionChangeCallback) this.#onSelectionChangeCallback();
	}

	updateBadgeCounter() {
		const count = this.#checkedCodes.size;
		if (this.#dom.badgeCounter) {
			this.#dom.badgeCounter.textContent = `${count} ${count === 1 ? "Page" : "Pages"} Ready`;
		}
		if (this.#dom.mobileBadgeCounter) {
			this.#dom.mobileBadgeCounter.textContent = count;
		}
	}
}

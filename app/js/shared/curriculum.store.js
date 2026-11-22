/**
 * CurriculumStore
 * Manages official IGNOU Curriculum data loaded from synchronous JS modules.
 * Single Responsibility: Course data loading, caching, and querying by locale.
 */
import { MCA_COURSES_EN } from "../../data/mca_courses.en.js";
import { MCA_COURSES_HI } from "../../data/mca_courses.hi.js";

export class CurriculumStore {
	static #curriculumData = null;
	static #currentLocale = "en";

	/**
	 * Formats raw course data structure into semKey lookup map.
	 * @private
	 */
	static #formatData(source) {
		const formatted = {};
		if (Array.isArray(source.semesters)) {
			source.semesters.forEach((sem) => {
				formatted[sem.sem] = {
					title: sem.title,
					courses: sem.courses.map((c) => ({
						code: c.code,
						title: c.title,
						assign: c.assignment_no,
						assignment_no: c.assignment_no,
					})),
				};
			});
		}
		return formatted;
	}

	/**
	 * Initializes or re-keys the store by locale without network roundtrips.
	 * Acts as Single Source of Truth (SSOT).
	 * @param {string} locale - 'en' or 'hi'
	 */
	static init(locale = "en") {
		this.#currentLocale = locale === "hi" ? "hi" : "en";
		const source = this.#currentLocale === "hi" ? MCA_COURSES_HI : MCA_COURSES_EN;
		this.#curriculumData = this.#formatData(source);
	}

	/**
	 * Switch locale dynamically and update cached courses.
	 * @param {string} locale - 'en' or 'hi'
	 */
	static setLocale(locale) {
		this.init(locale);
	}

	/**
	 * Returns current active locale.
	 * @returns {string}
	 */
	static get locale() {
		return this.#currentLocale;
	}

	/**
	 * Returns raw curriculum metadata (programme, university) for active locale.
	 */
	static getMetadata() {
		return this.#currentLocale === "hi" ? MCA_COURSES_HI : MCA_COURSES_EN;
	}

	/**
	 * Returns all courses across all semesters as a flat array.
	 * @returns {Array<{code: string, title: string, assign: string, sem: string}>}
	 */
	static getAllCourses() {
		if (!this.#curriculumData) this.init();
		const list = [];
		Object.keys(this.#curriculumData).forEach((semKey) => {
			this.#curriculumData[semKey].courses.forEach((c) => {
				list.push({ ...c, sem: String(semKey) });
			});
		});
		return list;
	}

	/**
	 * Returns courses and metadata for a specific semester.
	 * @param {string|number} semKey
	 * @returns {{title: string, courses: Array}|null}
	 */
	static getSemester(semKey) {
		if (!this.#curriculumData) this.init();
		return this.#curriculumData[semKey] || null;
	}
}

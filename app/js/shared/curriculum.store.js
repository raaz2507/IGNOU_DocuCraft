/**
 * CurriculumStore
 * Manages official IGNOU Curriculum data loaded dynamically from JSON.
 * Single Responsibility: Course data loading, caching, and querying.
 */
export class CurriculumStore {
	static #curriculumData = null;

	/**
	 * Initializes the store by fetching the JSON curriculum file.
	 * Acts as Single Source of Truth (SSOT).
	 * @param {string} dataPath - Relative URL to the JSON file
	 */
	static async init(dataPath = "./data/mca_courses.json") {
		if (this.#curriculumData) return;

		try {
			const res = await fetch(dataPath);
			if (!res.ok) {
				throw new Error(`HTTP error while fetching courses! status: ${res.status}`);
			}
			const data = await res.json();
			const formatted = {};

			if (Array.isArray(data.semesters)) {
				data.semesters.forEach((sem) => {
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

			this.#curriculumData = formatted;
		} catch (err) {
			console.error("CurriculumStore initialization failed:", err);
			this.#curriculumData = {};
		}
	}

	/**
	 * Returns all courses across all semesters as a flat array.
	 * @returns {Array<{code: string, title: string, assign: string, sem: string}>}
	 */
	static getAllCourses() {
		if (!this.#curriculumData) return [];
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
		if (!this.#curriculumData) return null;
		return this.#curriculumData[semKey] || null;
	}
}

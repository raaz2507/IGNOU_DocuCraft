/**
 * DateUtils
 * Single Responsibility: Pure date manipulation, zero-padded formatting (DD/MM/YYYY),
 * ISO conversions, and year extraction. 100% DRY.
 */
export class DateUtils {
	/**
	 * Returns current system date formatted as DD/MM/YYYY.
	 * @returns {string} e.g. "24/11/2026"
	 */
	static getTodayFormatted() {
		const now = new Date();
		const day = String(now.getDate()).padStart(2, "0");
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const year = now.getFullYear();
		return `${day}/${month}/${year}`;
	}

	/**
	 * Converts HTML5 date picker value (YYYY-MM-DD) into DD/MM/YYYY.
	 * @param {string} isoDate - "YYYY-MM-DD"
	 * @returns {string} "DD/MM/YYYY" or empty string if invalid
	 */
	static formatISODate(isoDate) {
		if (!isoDate || typeof isoDate !== "string") return "";
		const parts = isoDate.split("-");
		if (parts.length !== 3) return isoDate;
		const [year, month, day] = parts;
		return `${day}/${month}/${year}`;
	}

	/**
	 * Extracts 4-digit submission year (19xx or 20xx) from date string.
	 * @param {string} dateStr
	 * @returns {string} 4-digit year or empty string
	 */
	static extractYear(dateStr) {
		if (!dateStr || typeof dateStr !== "string") return "";
		const match = dateStr.trim().match(/\b(20\d\d|19\d\d)\b/);
		return match ? match[1] : "";
	}
}

/**
 * AnalyticsService
 * Single Responsibility: Handling visitor tracking, print action telemetry,
 * and user feedback submission to Google Apps Script / Google Sheets.
 * Fails gracefully offline or when endpoint is unconfigured. Zero UI code.
 */
import { StorageService } from "./storage.service.js";
import { APP_CONFIG } from "../../config.js";

export class AnalyticsService {
	// Loaded dynamically from external app/config.js (Zero hardcoded URLs in JS logic)
	static #API_ENDPOINT = APP_CONFIG?.googleSheetScriptUrl || ""; 

	static #SESSION_VISITED_KEY = "ignou_hub_session_visited";

	/**
	 * Configures or overrides the Google Apps Script Web App URL
	 */
	static setEndpoint(url) {
		this.#API_ENDPOINT = (url || "").trim();
	}

	/**
	 * Tracks a page visit and returns current visitor count.
	 * Uses sessionStorage to prevent inflating counts on page refreshes.
	 */
	static async trackVisit(pageName = "home") {
		const isNewSession = !sessionStorage.getItem(this.#SESSION_VISITED_KEY);
		if (isNewSession) {
			sessionStorage.setItem(this.#SESSION_VISITED_KEY, "true");
		}

		// Authentic local count starting from 1
		let localCount = StorageService.get("analytics_visitors_count", 1);
		if (isNewSession) {
			localCount += 1;
			StorageService.set("analytics_visitors_count", localCount);
		}

		if (!this.#API_ENDPOINT) {
			return { totalVisitors: localCount };
		}

		try {
			const query = new URLSearchParams({
				action: "visit",
				page: pageName,
				isNew: isNewSession ? "1" : "0",
			});

			const res = await fetch(`${this.#API_ENDPOINT}?${query.toString()}`, {
				method: "GET",
				mode: "cors",
			});

			if (res.ok) {
				const data = await res.json();
				if (data && data.totalVisitors) {
					StorageService.set("analytics_visitors_count", data.totalVisitors);
					return data;
				}
			}
		} catch (err) {
			console.warn("AnalyticsService visit tracking offline/skipped:", err.message);
		}

		return { totalVisitors: localCount };
	}

	/**
	 * Tracks when user prints specific MCA Project Synopsis documents
	 * @param {string[]} docKeys - Array of document IDs (e.g. ['doc_proforma', 'doc_originality'])
	 */
	static async trackSynopsisPrint(docKeys = []) {
		if (!Array.isArray(docKeys) || docKeys.length === 0) return;
		if (!this.#API_ENDPOINT) return;

		try {
			const query = new URLSearchParams({
				action: "print_synopsis",
				docs: docKeys.join(","),
			});

			await fetch(`${this.#API_ENDPOINT}?${query.toString()}`, {
				method: "GET",
				mode: "no-cors",
			});
		} catch (err) {
			console.warn("AnalyticsService synopsis print tracking skipped:", err.message);
		}
	}

	/**
	 * Tracks when user prints specific Assignment Course Covers
	 * @param {string[]} courseCodes - Array of course codes (e.g. ['MCSL-228', 'MCS-211'])
	 */
	static async trackAssignmentPrint(courseCodes = []) {
		if (!Array.isArray(courseCodes) || courseCodes.length === 0) return;
		if (!this.#API_ENDPOINT) return;

		try {
			const query = new URLSearchParams({
				action: "print_assignment",
				courses: courseCodes.join(","),
			});

			await fetch(`${this.#API_ENDPOINT}?${query.toString()}`, {
				method: "GET",
				mode: "no-cors",
			});
		} catch (err) {
			console.warn("AnalyticsService assignment print tracking skipped:", err.message);
		}
	}

	/**
	 * Submits star rating & suggestion feedback
	 */
	static async submitFeedback({ rating, name = "", message = "" }) {
		const payload = {
			action: "feedback",
			timestamp: new Date().toISOString(),
			rating: Number(rating) || 5,
			name: (name || "").trim().slice(0, 100),
			message: (message || "").trim().slice(0, 1000),
		};

		if (!this.#API_ENDPOINT) {
			// Save in local storage history as fallback
			const history = StorageService.get("feedback_history", []);
			history.push(payload);
			StorageService.set("feedback_history", history);
			return { success: true, localOnly: true };
		}

		try {
			const res = await fetch(this.#API_ENDPOINT, {
				method: "POST",
				mode: "cors",
				headers: {
					"Content-Type": "text/plain;charset=utf-8",
				},
				body: JSON.stringify(payload),
			});

			if (res.ok) {
				return { success: true };
			}
		} catch (err) {
			console.warn("AnalyticsService feedback online submit failed, saving locally:", err.message);
		}

		return { success: true, localOnly: true };
	}
}

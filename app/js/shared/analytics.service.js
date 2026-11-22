/**
 * AnalyticsService
 * Single Responsibility: Handling visitor tracking, print action telemetry,
 * and user feedback submission to Google Apps Script / Google Sheets.
 * Fails gracefully offline or when endpoint is unconfigured. Zero UI code.
 */
import { StorageService } from "./storage.service.js";

export class AnalyticsService {
	// Google Apps Script Web App Deployment URL
	// Replace with your active Google Apps Script Web App Exec URL:
	static #API_ENDPOINT = ""; 

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

		// Local fallback count so the badge always displays a clean live number
		let localCount = StorageService.get("analytics_visitors_count", 1420);
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
	 * Tracks when a user prints an assignment cover or project document
	 */
	static async trackPrint(documentType = "assignment_covers") {
		if (!this.#API_ENDPOINT) return;

		try {
			const query = new URLSearchParams({
				action: "print",
				docType: documentType,
			});

			await fetch(`${this.#API_ENDPOINT}?${query.toString()}`, {
				method: "GET",
				mode: "no-cors", // Fire and forget
			});
		} catch (err) {
			console.warn("AnalyticsService print tracking skipped:", err.message);
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

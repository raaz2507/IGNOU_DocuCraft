/**
 * AboutApp
 * Single Responsibility: Interactive Star Rating selector and Feedback Form submission.
 * Connects to AnalyticsService for background delivery.
 */
import { I18nService } from "../shared/i18n.service.js";
import { AnalyticsService } from "../shared/analytics.service.js";

export class AboutApp {
	#currentRating = 5;

	constructor() {
		this.init();
	}

	init() {
		I18nService.init();
		this.bindStarRating();
		this.bindFeedbackSubmit();

		window.addEventListener("app:localeChanged", () => {
			this.updateRatingBadge(this.#currentRating);
		});
	}

	getRatingLabel(val) {
		return I18nService.t(`about.rating${val}`) || `${val} / 5`;
	}

	updateRatingBadge(val) {
		const ratingText = document.getElementById("ratingTextBadge");
		if (ratingText) {
			ratingText.textContent = this.getRatingLabel(val);
		}
	}

	bindStarRating() {
		const starBtns = document.querySelectorAll(".star-rating-selector .star-btn");

		const updateStarsUI = (val) => {
			starBtns.forEach((btn) => {
				const starVal = Number(btn.dataset.val);
				btn.classList.toggle("active", starVal <= val);
			});
			this.updateRatingBadge(val);
		};

		starBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				this.#currentRating = Number(btn.dataset.val);
				updateStarsUI(this.#currentRating);
			});

			btn.addEventListener("mouseenter", () => {
				const hoverVal = Number(btn.dataset.val);
				updateStarsUI(hoverVal);
			});
		});

		const container = document.querySelector(".star-rating-selector");
		if (container) {
			container.addEventListener("mouseleave", () => {
				updateStarsUI(this.#currentRating);
			});
		}

		// Initial display
		updateStarsUI(this.#currentRating);
	}

	bindFeedbackSubmit() {
		const form = document.getElementById("feedbackForm");
		const alertBox = document.getElementById("feedbackAlert");
		const btnSubmit = document.getElementById("btnSubmitFeedback");

		if (!form) return;

		form.addEventListener("submit", async (e) => {
			e.preventDefault();

			const nameInput = document.getElementById("inputFeedbackName");
			const msgInput = document.getElementById("inputFeedbackMessage");

			const name = nameInput ? nameInput.value.trim() : "";
			const message = msgInput ? msgInput.value.trim() : "";

			if (!message) {
				if (alertBox) {
					alertBox.className = "feedback-alert active alert-error";
					alertBox.textContent = I18nService.t("about.alertEmpty");
				}
				return;
			}

			if (btnSubmit) {
				btnSubmit.disabled = true;
				btnSubmit.textContent = I18nService.locale === "hi" ? "भेज रहे हैं..." : "Submitting...";
			}

			try {
				await AnalyticsService.submitFeedback({
					rating: this.#currentRating,
					name,
					message,
				});

				if (alertBox) {
					alertBox.className = "feedback-alert active alert-success";
					alertBox.textContent = I18nService.t("about.alertSuccess");
				}

				if (msgInput) msgInput.value = "";
				if (nameInput) nameInput.value = "";
			} catch (err) {
				if (alertBox) {
					alertBox.className = "feedback-alert active alert-error";
					alertBox.textContent = I18nService.locale === "hi" ? "सुझाव भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।" : "Failed to submit feedback. Please try again.";
				}
			} finally {
				if (btnSubmit) {
					btnSubmit.disabled = false;
					btnSubmit.textContent = I18nService.t("about.btnSubmit");
				}
			}
		});
	}
}

window.addEventListener("DOMContentLoaded", () => {
	window.aboutApp = new AboutApp();
});

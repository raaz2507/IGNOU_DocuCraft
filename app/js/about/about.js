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
	}

	bindStarRating() {
		const starBtns = document.querySelectorAll(".star-rating-selector .star-btn");
		const ratingText = document.getElementById("ratingTextBadge");

		const ratingLabels = {
			1: "1 / 5 (सुधार की ज़रूरत)",
			2: "2 / 5 (औसत)",
			3: "3 / 5 (अच्छा)",
			4: "4 / 5 (बहुत बढ़िया)",
			5: "5 / 5 (उत्कृष्ट! ⭐)",
		};

		const updateStarsUI = (val) => {
			starBtns.forEach((btn) => {
				const starVal = Number(btn.dataset.val);
				btn.classList.toggle("active", starVal <= val);
			});
			if (ratingText) {
				ratingText.textContent = ratingLabels[val] || `${val} / 5`;
			}
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
					alertBox.textContent = "कृपया अपना सुझाव या संदेश दर्ज करें।";
				}
				return;
			}

			if (btnSubmit) {
				btnSubmit.disabled = true;
				btnSubmit.textContent = "भेज रहे हैं...";
			}

			try {
				await AnalyticsService.submitFeedback({
					rating: this.#currentRating,
					name,
					message,
				});

				if (alertBox) {
					alertBox.className = "feedback-alert active alert-success";
					alertBox.textContent = "धन्यवाद! आपका सुझाव और रेटिंग सफलतापूर्वक प्राप्त हो गई।";
				}

				if (msgInput) msgInput.value = "";
				if (nameInput) nameInput.value = "";
			} catch (err) {
				if (alertBox) {
					alertBox.className = "feedback-alert active alert-error";
					alertBox.textContent = "सुझाव भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।";
				}
			} finally {
				if (btnSubmit) {
					btnSubmit.disabled = false;
					btnSubmit.textContent = "सुझाव भेजें (Submit Feedback)";
				}
			}
		});
	}
}

window.addEventListener("DOMContentLoaded", () => {
	window.aboutApp = new AboutApp();
});

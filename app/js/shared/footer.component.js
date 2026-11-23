/**
 * IgnouFooter Component (Web Component)
 * Single Responsibility: Common Application Footer & Academic Disclaimers.
 * Reusable across index.html, assignment front page, and project studio.
 */
import { AnalyticsService } from "./analytics.service.js";

export class IgnouFooter extends HTMLElement {
	connectedCallback() {
		this.render();
		this.initVisitorCounter();
	}

	initVisitorCounter() {
		const path = window.location.pathname.toLowerCase();
		const page = path.includes("project")
			? "project"
			: path.includes("assignment")
			? "assignment"
			: path.includes("help")
			? "help"
			: path.includes("about")
			? "about"
			: "home";

		AnalyticsService.trackVisit(page).then((res) => {
			const badgeVal = this.querySelector("#visitorCountVal");
			if (badgeVal && res && res.totalVisitors) {
				badgeVal.textContent = Number(res.totalVisitors).toLocaleString();
			}
		});
	}

	render() {
		const year = new Date().getFullYear();
		this.innerHTML = `
		<footer class="app-global-footer">
			<div class="footer-inner">
				<div class="footer-col-info">
					<p class="footer-disclaimer">
						<strong>Disclaimer:</strong> This is an independent academic productivity tool developed for IGNOU students.
						All format layouts, rubrics, and guidelines follow the official curriculum standards of SOCIS / IGNOU.
					</p>
					<p class="footer-copy">
						© ${year} IGNOU DocuCraft • Single Source of Truth Architecture
					</p>
				</div>
				<div class="footer-col-badges">
					<span class="visitor-counter-badge" id="globalVisitorBadge" title="Total Hub Visitors">
						<span class="pulse-dot" aria-hidden="true"></span>
						<span>Visits: <strong id="visitorCountVal">—</strong></span>
					</span>
					<span class="tech-badge">Vanilla ES6+</span>
					<span class="tech-badge">Modular CSS Layers</span>
					<span class="tech-badge">Pixel-Perfect 1:1 Print</span>
				</div>
			</div>
			<!-- Full-Length Dedicated Developer Credit Strip -->
			<div class="footer-credit-strip">
				<span>Developed by <strong>Rajaanha</strong> <span class="heart-pulse-emoji" aria-hidden="true">❤️</span></span>
			</div>
		</footer>
		`;
	}
}

if (!customElements.get("ignou-footer")) {
	customElements.define("ignou-footer", IgnouFooter);
}

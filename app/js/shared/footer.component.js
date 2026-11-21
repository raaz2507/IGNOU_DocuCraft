/**
 * IgnouFooter Component (Web Component)
 * Single Responsibility: Common Application Footer & Academic Disclaimers.
 * Reusable across index.html, assignment front page, and project studio.
 */
export class IgnouFooter extends HTMLElement {
	connectedCallback() {
		this.render();
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
						© ${year} IGNOU Doc Automation • Single Source of Truth Architecture
					</p>
				</div>
				<div class="footer-col-badges">
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

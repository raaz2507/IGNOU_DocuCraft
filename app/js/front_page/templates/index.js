/**
 * Front Page Template Registry / Dispatcher
 * Single Responsibility: Selects and executes the requested template generator.
 */
import { buildClassicTemplate } from "./classic.template.js";
import { buildModernTemplate } from "./modern.template.js";
import { buildGazetteTemplate } from "./gazette.template.js";
import { buildPortfolioTemplate } from "./portfolio.template.js";

export const TemplateRegistry = {
	render(templateKey, course, hasSig, sigSrc) {
		switch (templateKey) {
			case "modern":
				return buildModernTemplate(course, hasSig, sigSrc);
			case "gazette":
				return buildGazetteTemplate(course, hasSig, sigSrc);
			case "portfolio":
				return buildPortfolioTemplate(course, hasSig, sigSrc);
			case "classic":
			default:
				return buildClassicTemplate(course, hasSig, sigSrc);
		}
	},
};

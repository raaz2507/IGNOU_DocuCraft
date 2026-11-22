/**
 * Templates Metadata Facade
 * Decoupled into locale-specific modules: templates_metadata.en.js & templates_metadata.hi.js
 */
import { TEMPLATES_METADATA_EN } from "./templates_metadata.en.js";
import { TEMPLATES_METADATA_HI } from "./templates_metadata.hi.js";

export { TEMPLATES_METADATA_EN, TEMPLATES_METADATA_HI };

/**
 * Helper to fetch metadata based on locale string ('en' or 'hi')
 * @param {string} locale
 * @returns {ReadonlyArray<Object>}
 */
export function getTemplatesMetadataByLocale(locale = "en") {
	return locale === "hi" ? TEMPLATES_METADATA_HI : TEMPLATES_METADATA_EN;
}

// Backward compatibility default
export const TEMPLATES_METADATA = TEMPLATES_METADATA_EN;

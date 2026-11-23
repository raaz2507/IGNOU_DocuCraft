/**
 * =============================================================================
 * IGNOU DOCUCRAFT - EXTERNAL APPLICATION CONFIGURATION
 * =============================================================================
 * Single Source of Truth for all external links, endpoints, and video tutorials.
 * 
 * Edit this file whenever you need to update:
 *  1. Google Sheet Apps Script Web App URL (for visitor analytics & feedback)
 *  2. "How to Use" YouTube Tutorial Video link
 *  3. Your YouTube Channel / Social links
 * 
 * Zero need to touch core JS or HTML files!
 * =============================================================================
 */

export const APP_CONFIG = Object.freeze({
	// 1. Google Sheets Telemetry & Student Feedback Backend URL
	googleSheetScriptUrl: "https://script.google.com/macros/s/AKfycbwt7if3TWs2Y6UPqmyYvY397Rs8pDYDPX4lWmJ1JNh1MgsS5L6qQ9Y2fORYKlXLXN2U/exec",

	// 2. Video Tutorials & Help Links
	videos: {
		// Put any standard YouTube watch link or youtu.be short link here:
		howToUseUrl: "https://youtu.be/SGjaSTP-mbM",
		
		// Optional: Your YouTube Channel Link
		channelUrl: "https://www.youtube.com",
	},

	// 3. Official University References (Optional)
	references: {
		ignouPortal: "http://www.ignou.ac.in",
		socisPortal: "http://www.ignou.ac.in/ignou/aboutignou/school/socis/introduction",
		mcaProjectGuidelinesPdf: "https://webservices.ignou.ac.in/assignments/Master-Degree/MCA_NEW/2025/MCSP%20232%20-%20Project%20Guidelines%20-%20MCA_NEW.pdf",
	}
});

/**
 * Utility helper to extract YouTube Video ID and return 
 * an HQ thumbnail image URL.
 */
export function getYouTubeThumbnailUrl(url) {
	if (!url) return "";
	const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
	return match && match[2].length === 11
		? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`
		: "";
}

/**
 * Utility helper to safely extract YouTube Video ID and return 
 * a high-compatibility embed URL for responsive iframes.
 * Supports: https://www.youtube.com/watch?v=ID, https://youtu.be/ID, embed/ID
 */
export function getYouTubeEmbedUrl(url) {
	if (!url) return "";
	const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
	return match && match[2].length === 11
		? `https://www.youtube.com/embed/${match[2]}`
		: url;
}

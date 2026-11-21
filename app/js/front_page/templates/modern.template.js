/**
 * Template 2: Modern Minimalist Grid (Clean Card Layout)
 * Single Responsibility: Markup generator for Modern Template.
 */
export function buildModernTemplate(course, hasSig, sigSrc, logoPath = "./assets/IGNOU_logo.svg") {
	const pageClasses = hasSig ? "page-sheet tpl-modern has-signature" : "page-sheet tpl-modern";
	return `
    <div class="page-viewport-scaler">
        <article class="${pageClasses}" data-course="${course.code}">
            <header class="modern-header">
                <img src="${logoPath}" alt="IGNOU Logo" class="modern-logo">
                <div class="modern-title-group">
                    <h1>Indira Gandhi National Open University</h1>
                    <p>Student Assignment Submission Record</p>
                    <span class="modern-session-tag">Academic Session 2025–2026</span>
                </div>
            </header>
            <main>
                <section class="modern-section">
                    <div class="modern-sec-heading">1. Candidate Credentials</div>
                    <div class="modern-grid-2col">
                        <div class="modern-field-cell">
                            <span class="modern-cell-label">Enrolment Number</span>
                            <span class="ink-text val-Enrolment"></span>
                        </div>
                        <div class="modern-field-cell">
                            <span class="modern-cell-label">Student Name</span>
                            <span class="ink-text val-Name"></span>
                        </div>
                        <div class="modern-field-cell">
                            <span class="modern-cell-label">Programme Title</span>
                            <span class="ink-text val-Programme"></span>
                        </div>
                        <div class="modern-field-cell">
                            <span class="modern-cell-label">Mobile Phone</span>
                            <span class="ink-text val-Phone"></span>
                        </div>
                        <div class="modern-field-cell cell-full">
                            <span class="modern-cell-label">Residential Address</span>
                            <span class="ink-text"><span class="val-Address1"></span>, <span class="val-Address2"></span></span>
                        </div>
                        <div class="modern-field-cell cell-full">
                            <span class="modern-cell-label">Email ID</span>
                            <span class="ink-text val-Email"></span>
                        </div>
                    </div>
                </section>
                <section class="modern-section">
                    <div class="modern-sec-heading">2. Course &amp; Submission Particulars</div>
                    <div class="modern-grid-2col">
                        <div class="modern-field-cell">
                            <span class="modern-cell-label">Course Code</span>
                            <span class="ink-text">${course.code}</span>
                        </div>
                        <div class="modern-field-cell">
                            <span class="modern-cell-label">Assignment Code / Number</span>
                            <span class="ink-text">${course.assign}</span>
                        </div>
                        <div class="modern-field-cell cell-full">
                            <span class="modern-cell-label">Course Title</span>
                            <span class="ink-text">${course.title}</span>
                        </div>
                        <div class="modern-field-cell cell-full">
                            <span class="modern-cell-label">Study Centre Name &amp; Code</span>
                            <span class="ink-text"><span class="val-StudyCentre1"></span> <span class="val-StudyCentre2"></span></span>
                        </div>
                    </div>
                </section>
                <div class="modern-decl-box">
                    <strong>Student Declaration:</strong> I hereby declare that the assignment submitted above has been worked out and drafted by myself. No portion of this work is copied or plagiarized from any external unauthorized source.
                </div>
            </main>
            <footer class="modern-footer">
                <div class="modern-footer-item">
                    <span class="modern-sig-label">Date of Submission:</span>
                    <div class="modern-sig-line">
                        <span class="ink-text val-Date"></span>
                    </div>
                </div>
                <div class="modern-footer-item">
                    <span class="modern-sig-label">Signature of Student:</span>
                    <div class="modern-sig-line">
                        <img class="ink-signature-img val-SignatureImg" src="${sigSrc}" alt="Signature">
                    </div>
                </div>
            </footer>
        </article>
    </div>`;
}

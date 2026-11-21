/**
 * Template 4: Executive Lab Portfolio (Left Accent Bar & Stamp)
 * Single Responsibility: Markup generator for Portfolio Template.
 */
export function buildPortfolioTemplate(course, hasSig, sigSrc, logoPath = "./assets/IGNOU_logo.svg") {
	const pageClasses = hasSig ? "page-sheet tpl-portfolio has-signature" : "page-sheet tpl-portfolio";
	return `
    <div class="page-viewport-scaler">
        <article class="${pageClasses}" data-course="${course.code}">
            <div class="portfolio-accent-bar">
                <div class="accent-dots">
                    <span></span><span></span><span></span>
                </div>
                <div class="accent-strip-text">
                    IGNOU • SCHOOL OF COMPUTER &amp; INFORMATION SCIENCES • MCA_NEW
                </div>
                <div class="accent-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
            <div class="portfolio-content-area">
                <header class="portfolio-header">
                    <img src="${logoPath}" alt="IGNOU Logo" class="portfolio-logo">
                    <div class="portfolio-dept-info">
                        <p class="dept-name">School of Computer &amp; Information Sciences</p>
                        <span class="lab-report-badge">Practical Lab Report / Term-End Cover</span>
                    </div>
                </header>
                <main>
                    <div class="portfolio-card">
                        <span class="portfolio-card-title">Candidate Profile &amp; Contact</span>
                        <div class="portfolio-row">
                            <span class="p-label">Enrolment No.:</span>
                            <div class="p-val-wrapper"><span class="ink-text val-Enrolment"></span></div>
                        </div>
                        <div class="portfolio-row">
                            <span class="p-label">Student Name:</span>
                            <div class="p-val-wrapper"><span class="ink-text val-Name"></span></div>
                        </div>
                        <div class="portfolio-row">
                            <span class="p-label">Programme:</span>
                            <div class="p-val-wrapper"><span class="ink-text val-Programme"></span></div>
                        </div>
                        <div class="portfolio-row">
                            <span class="p-label">Address:</span>
                            <div class="p-val-wrapper"><span class="ink-text"><span class="val-Address1"></span>, <span class="val-Address2"></span></span></div>
                        </div>
                        <div class="portfolio-row">
                            <span class="p-label">Phone &amp; Email:</span>
                            <div class="p-val-wrapper"><span class="ink-text"><span class="val-Phone"></span> | <span class="val-Email"></span></span></div>
                        </div>
                    </div>

                    <div class="portfolio-card">
                        <span class="portfolio-card-title">Laboratory Course Details</span>
                        <div class="portfolio-row">
                            <span class="p-label">Course Title:</span>
                            <div class="p-val-wrapper"><span class="ink-text">${course.title}</span></div>
                        </div>
                        <div class="portfolio-row">
                            <span class="p-label">Course Code:</span>
                            <div class="p-val-wrapper"><span class="ink-text">${course.code}</span></div>
                        </div>
                        <div class="portfolio-row">
                            <span class="p-label">Assignment No.:</span>
                            <div class="p-val-wrapper"><span class="ink-text">${course.assign}</span></div>
                        </div>
                        <div class="portfolio-row">
                            <span class="p-label">Study Centre:</span>
                            <div class="p-val-wrapper"><span class="ink-text"><span class="val-StudyCentre1"></span> <span class="val-StudyCentre2"></span></span></div>
                        </div>
                    </div>
                </main>

                <div class="portfolio-bottom-row">
                    <div class="portfolio-sig-col">
                        <span class="p-sig-title">Submission Date:</span>
                        <div class="p-sig-box">
                            <span class="ink-text val-Date"></span>
                        </div>
                        <span class="p-sig-title">Candidate Signature:</span>
                        <div class="p-sig-box">
                            <img class="ink-signature-img val-SignatureImg" src="${sigSrc}" alt="Signature">
                        </div>
                    </div>
                    <div class="portfolio-stamp-col">
                        <div class="stamp-header">Study Centre Verification &amp; Seal</div>
                        <div class="stamp-body">Official Study Centre Stamp Here</div>
                        <div class="stamp-footer">Authorized Signature &amp; Date</div>
                    </div>
                </div>
            </div>
        </article>
    </div>`;
}

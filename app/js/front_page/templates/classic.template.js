/**
 * Template 1: Classic IGNOU Official (Standard Double Border)
 * Single Responsibility: Markup generator for Classic Template.
 */
export function buildClassicTemplate(course, hasSig, sigSrc, logoPath = "./assets/IGNOU_logo.svg") {
	const pageClasses = hasSig ? "page-sheet tpl-classic has-signature" : "page-sheet tpl-classic";
	return `
    <div class="page-viewport-scaler">
        <article class="${pageClasses}" data-course="${course.code}">
            <div class="outer-border">
                <div class="inner-border">
                    <header class="header-logo-section">
                        <img src="${logoPath}" alt="IGNOU Logo">
                    </header>
                    <main class="form-content">
                        <section class="student-profile-section">
                            <div class="form-row">
                                <span class="form-label">ENROLMENT NO.:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text val-Enrolment"></span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">NAME:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text val-Name"></span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">ADDRESS:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text val-Address1"></span>
                                </div>
                            </div>
                            <div class="continuation-row">
                                <div class="line-wrapper">
                                    <div class="continuation-dotted-line"></div>
                                    <span class="ink-text val-Address2"></span>
                                </div>
                            </div>
                        </section>
                        <section class="course-details-section">
                            <div class="form-row">
                                <span class="form-label">PROGRAMME TITLE:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text val-Programme"></span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">COURSE TITLE:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text">${course.title}</span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">COURSE CODE:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text">${course.code}</span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">ASSIGNMENT NO.:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text">${course.assign}</span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">STUDY CENTRE:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text val-StudyCentre1"></span>
                                </div>
                            </div>
                            <div class="continuation-row">
                                <div class="line-wrapper">
                                    <div class="continuation-dotted-line"></div>
                                    <span class="ink-text val-StudyCentre2"></span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">PHONE NO.:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text val-Phone"></span>
                                </div>
                            </div>
                            <div class="form-row">
                                <span class="form-label">EMAIL ID:</span>
                                <div class="line-wrapper">
                                    <div class="dotted-line"></div>
                                    <span class="ink-text val-Email"></span>
                                </div>
                            </div>
                        </section>
                    </main>
                    <footer class="footer-section">
                        <div class="footer-col-left">
                            <span class="form-label">DATE:</span>
                            <div class="line-wrapper">
                                <div class="dotted-line"></div>
                                <span class="ink-text val-Date"></span>
                            </div>
                        </div>
                        <div class="footer-col-right">
                            <span class="form-label">SIGNATURE:</span>
                            <div class="line-wrapper">
                                <div class="dotted-line"></div>
                                <img class="ink-signature-img val-SignatureImg" src="${sigSrc}" alt="Signature">
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </article>
    </div>`;
}

/**
 * Template 3: Bilingual University Gazette (With Marks Rubric Table)
 * Single Responsibility: Markup generator for Gazette Template.
 */
export function buildGazetteTemplate(course, hasSig, sigSrc, logoPath = "./assets/IGNOU_logo.svg") {
	const pageClasses = hasSig ? "page-sheet tpl-gazette has-signature" : "page-sheet tpl-gazette";
	return `
    <div class="page-viewport-scaler">
        <article class="${pageClasses}" data-course="${course.code}">
            <header class="gazette-header">
                <h2 class="gazette-hindi-title">इन्दिरा गांधी राष्ट्रीय मुक्त विश्वविद्यालय</h2>
                <h1 class="gazette-eng-title">Indira Gandhi National Open University</h1>
                <div class="gazette-address">Maidan Garhi, New Delhi – 110068 | Student Evaluation Division</div>
                <img src="${logoPath}" alt="IGNOU Logo" class="gazette-logo">
                <div class="gazette-banner">Assignment Evaluation &amp; Despatch Cover Sheet</div>
            </header>
            <main>
                <table class="gazette-info-table">
                    <tr>
                        <td class="cell-label">Enrolment Number</td>
                        <td class="cell-value"><span class="ink-text val-Enrolment"></span></td>
                        <td class="cell-label">Programme Title</td>
                        <td class="cell-value"><span class="ink-text val-Programme"></span></td>
                    </tr>
                    <tr>
                        <td class="cell-label">Student Name</td>
                        <td class="cell-value"><span class="ink-text val-Name"></span></td>
                        <td class="cell-label">Course Code</td>
                        <td class="cell-value"><span class="ink-text">${course.code}</span></td>
                    </tr>
                    <tr>
                        <td class="cell-label">Course Title</td>
                        <td class="cell-value" colspan="3"><span class="ink-text">${course.title}</span></td>
                    </tr>
                    <tr>
                        <td class="cell-label">Assignment Number</td>
                        <td class="cell-value"><span class="ink-text">${course.assign}</span></td>
                        <td class="cell-label">Mobile Number</td>
                        <td class="cell-value"><span class="ink-text val-Phone"></span></td>
                    </tr>
                    <tr>
                        <td class="cell-label">Study Centre</td>
                        <td class="cell-value" colspan="3"><span class="ink-text"><span class="val-StudyCentre1"></span> <span class="val-StudyCentre2"></span></span></td>
                    </tr>
                    <tr>
                        <td class="cell-label">Student Address</td>
                        <td class="cell-value" colspan="3"><span class="ink-text"><span class="val-Address1"></span>, <span class="val-Address2"></span></span></td>
                    </tr>
                </table>

                <section class="gazette-marks-section">
                    <div class="marks-heading">Official Evaluation Matrix (For Evaluator's / Counsellor's Use Only)</div>
                    <table class="marks-table">
                        <thead>
                            <tr>
                                <th>Question No.</th>
                                <th>Q1</th>
                                <th>Q2</th>
                                <th>Q3</th>
                                <th>Q4</th>
                                <th>Q5</th>
                                <th>Total Marks (100)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Max Marks</strong></td>
                                <td>20</td>
                                <td>20</td>
                                <td>20</td>
                                <td>20</td>
                                <td>20</td>
                                <td>100</td>
                            </tr>
                            <tr>
                                <td><strong>Marks Awarded</strong></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                            </tr>
                            <tr class="evaluator-row">
                                <td colspan="4" class="evaluator-remarks-cell"><strong>Evaluator's Remarks:</strong></td>
                                <td colspan="3" class="evaluator-sig-cell"><strong>Evaluator's Signature &amp; Date:</strong> ________________</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </main>
            <footer class="gazette-footer">
                <div class="gazette-footer-col">
                    <span class="col-label">Date of Submission:</span>
                    <div class="sig-dash-line">
                        <span class="ink-text val-Date"></span>
                    </div>
                </div>
                <div class="gazette-footer-col">
                    <span class="col-label">Signature of the Student:</span>
                    <div class="sig-dash-line">
                        <img class="ink-signature-img val-SignatureImg" src="${sigSrc}" alt="Signature">
                    </div>
                </div>
            </footer>
        </article>
    </div>`;
}

# IGNOU Document Automation Hub - Project Synopsis Kit Roadmap

> **Status Tracking & Architecture Plan**  
> *Single Source of Truth for Project Synopsis Kit Implementation (MCSP-232 & Generic Curriculum)*

---

## 📌 Phased Implementation Plan

- [x] **Phase 1: Project Synopsis Architecture & Shell Foundation**
  - [x] Activate "Project Synopsis Kit" tool card in [index.html](file:///d:/projects/IGNOU_doc_automation/app/index.html) with direct studio link
  - [x] Build core UI in [project_synopsis.html](file:///d:/projects/IGNOU_doc_automation/app/project_synopsis.html) (Left 4-tab control panel + Right live A4 preview stage)
  - [x] 4-Tab Control Panel Navigation (`paneDocSelection`, `paneProjectParticulars`, `paneGuideInfo`, `paneStudentBio`)
  - [x] Dynamic Document Checklist Selector (`project_doc_selector.js` with batch select/deselect)
  - [x] Auto-populate shared student profile data from assignment covers (`Enrolment`, `Name`, `StudyCentre`, `RC`, `Phone`, `Email`)

- [x] **Phase 2: Document 1 — Annexure II (Project Proposal Approval Proforma)**
  - [x] Reference: `temprary_working_dir/II. PROFORMA FOR THE APPROVAL OF MCA PROJECT PROPOSAL (MCSP-232)-1.jpg` (Page 5)
  - [x] Exact 1:1 visual fidelity template in [doc_proforma.template.html](file:///d:/projects/IGNOU_doc_automation/app/templates/project_synopsis/doc_proforma.template.html)
  - [x] Single outer border frame (1.4px solid black, 3px expanded for maximum internal space)
  - [x] Balanced `space-evenly` alignment for Student & Guide signatures
  - [x] 2-line Guide Address (`GuideAddress1`, `GuideAddress2`) in form & document
  - [x] 5 multi-select degree checkboxes for Guide (`phd`, `mtech`, `be_btech`, `mca`, `msc`)
  - [x] Section VIII Software Tech Stack chips & collapsible guidelines card (Page 18)
  - [x] High-legibility upright casual print handwriting font (`Patrick Hand`)
  - [x] Balanced vertical spacing with resized evaluator Suggestions Box (`min-height: 20mm`)
  - [x] Clean calendar date pickers for both Student Submission Date & Guide Date (no implicit default inheritance)
  - [x] Reusable `SignatureUploaderController` module for both Student and Guide signatures

- [x] **Phase 3: Document 2 — Project Trainee Request Letter (MCSP-232)**
  - [x] Reference: `temprary_working_dir/Project Trainee Letter (MCSP-232) -1.jpg` (Page 19)
  - [x] Official School letterhead (SOCIS emblem, phone 29572902, New Delhi address)
  - [x] Trainee request body text with underlined student name and enrolment number
  - [x] Dynamic Programme & Course Code binding (`val-ProgrammeTitle`, `val-ProgrammeCode`, `val-CourseCode`)
  - [x] Regional Director / ARD / DD authority signature & stamp block
  - [x] Create [doc_trainee_letter.template.html](file:///d:/projects/IGNOU_doc_automation/app/templates/project_synopsis/doc_trainee_letter.template.html)
  - [x] Create [doc_trainee_letter.css](file:///d:/projects/IGNOU_doc_automation/app/css/templates/project_synopsis/doc_trainee_letter.css) (Token-based, `@layer components`, zero `!important`)
  - [x] Wire into [project_templates.css](file:///d:/projects/IGNOU_doc_automation/app/css/modules/project_templates.css) and template registry

- [x] **Phase 4: Document 3 & 4 — Certificate of Originality & Project Cover Page**
  - [x] **Document 3: Annexure X — Certificate of Originality (Page 20)**
    - [x] Reference: `temprary_working_dir/X. CERTIFICATE OF ORIGINALITY-1.jpg`
    - [x] Bordered centered title box: `X.   CERTIFICATE OF ORIGINALITY`
    - [x] Full official declaration text binding Project Title, University Name, Degree, Student Name & Enrolment
    - [x] Balanced dual-column layout for Student and Guide with digital signatures, dates & 4-line address blocks
    - [x] Create [doc_originality.template.html](file:///d:/projects/IGNOU_doc_automation/app/templates/project_synopsis/doc_originality.template.html)
    - [x] Create [doc_originality.css](file:///d:/projects/IGNOU_doc_automation/app/css/templates/project_synopsis/doc_originality.css) (Token-based, `@layer components`, zero `!important`)
    - [x] Wire into [project_templates.css](file:///d:/projects/IGNOU_doc_automation/app/css/modules/project_templates.css)
  - [x] **Document 4: Annexure XI — Sample Cover Page (Page 21)**
    - [x] Reference: `temprary_working_dir/XI SAMPLE COVER PAGE OF THE PROJECT REPORT -1.jpg`
    - [x] Exact official typography, centered layout, IGNOU emblem, programme & course metadata
    - [x] Arched SVG curve for university header (`INDIRA GANDHI NATIONAL OPEN UNIVERSITY`)
    - [x] Create [doc_project_cover.template.html](file:///d:/projects/IGNOU_doc_automation/app/templates/project_synopsis/doc_project_cover.template.html)
    - [x] Create [doc_project_cover.css](file:///d:/projects/IGNOU_doc_automation/app/css/templates/project_synopsis/doc_project_cover.css) (Token-based, `@layer components`, zero `!important`)
    - [x] Wire into [project_templates.css](file:///d:/projects/IGNOU_doc_automation/app/css/modules/project_templates.css)

- [ ] **Phase 5: Combined Batch Print Engine & Final Verification**
  - [ ] Verify selective printing (print only checked documents or all 4 pages in sequence)
  - [ ] Margin-free A4 page break CSS (`page-break-after: always; break-after: page;`)
  - [ ] High-resolution print verification against original IGNOU handbooks

---

## 🏗️ Code Health & Refactoring Checklist (DRY & SRP)

- [x] Extract `SignatureUploaderController` from `ProjectForm` to make signature handling 100% DRY across student and guide.
- [x] Promote `DeckStageController` and `StageLightboxModal` into `app/js/shared/` to share 3D Deck, 1:1 Sheet view switcher, and Fullscreen Lightbox with zero code duplication.
- [x] Create centralized Data Vault Schema & SSOT in [hub_schema.js](file:///d:/projects/IGNOU_doc_automation/docs/hub_schema.js) with typed JSDoc comments, factory, and migration logic.
- [ ] Implement lightweight Data Stores (`StudentStore`, `GuideStore`, `ProjectStore`) separated from UI DOM Controllers.

---

## 📦 Unified Data Vault Schema (Single Source of Truth)

Central JavaScript specification: [docs/hub_schema.js](file:///d:/projects/IGNOU_doc_automation/docs/hub_schema.js)

```javascript
{
  "meta": { "version": "1.0", "exportedAt": "ISO-8601 Timestamp" },
  
  // 1. Shared Student Profile (Universal identity across Hub)
  "student": {
    "enrolment": "2105678942",
    "name": "Neha Khan",
    "address1": "House No. 100, B-Block",
    "address2": "Jhangirpuri, New Delhi - 110033",
    "studyCentreCode": "2906",
    "studyCentreName": "SGTB Khalsa College",
    "regionalCentre": "Delhi-3",
    "regionalCentreCode": "38",
    "phone": "+91 9211420240",
    "email": "nehakhan@gmail.com",
    "signature": { "data": "data:image/webp;base64,...", "scale": 1.0 }
  },

  // 2. Guide Profile (Independent mentor credentials & digital signature)
  "guide": {
    "name": "Dr. Rajesh Kumar Sharma",
    "address1": "Dept. of Computer Science, Faculty of Mathematical Sciences",
    "address2": "University of Delhi, North Campus, Delhi - 110007",
    "degrees": ["phd", "mtech"], // Multi-select array: phd, mtech, be_btech, mca, msc
    "experience": "14 Years teaching experience as Associate Professor in DU",
    "signature": { "data": "data:image/webp;base64,...", "scale": 1.0 },
    "date": "22/11/2026"
  },

  // 3. Project Particulars & Artifact Metadata
  "project": {
    "programmeCode": "MCA_NEW",
    "courseCode": "MCSP-232",
    "title": "AI-Powered Healthcare Diagnostic Portal",
    "software": "Python 3.12, Django, PostgreSQL, React",
    "firstSubmission": "yes", // 'yes' | 'no'
    "submissionDate": "22/11/2026",
    "submissionYear": "2026", // Auto-derived from submissionDate
    "selectedDocIds": ["proforma", "trainee_letter", "originality", "project_cover"]
  },

  // 4. User Preferences
  "preferences": {
    "locale": "hi", // 'hi' | 'en'
    "deckMode": "sheet", // 'deck' | 'sheet'
    "isSampleGhostActive": false
  }
}
```

- [ ] Review CSS stylesheets for token-based variable adherence and eliminate redundant or copy-pasted rules.
- [ ] Ensure shared components and storage keys follow a unified naming convention.

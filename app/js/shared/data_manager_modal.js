/**
 * DataManagerModal
 * Single Responsibility: UI presentation, tabs, user confirmation, and file picker interactions
 * for Backup, Restore, and Reset. Delegates data validation & I/O to DataManagerService.
 */
import { DataManagerService } from "./data_manager.service.js";
import { StorageService } from "./storage.service.js";
import { I18nService } from "./i18n.service.js";

export class DataManagerModal {
	static #dom = null;
	static #activeTab = "backup";
	static #pendingPayload = null;

	/**
	 * Lazy-initializes and mounts the modal to document.body
	 */
	static #ensureMounted() {
		if (this.#dom) return;

		const container = document.createElement("div");
		container.id = "dataManagerModal";
		container.className = "data-modal-backdrop";
		container.setAttribute("role", "dialog");
		container.setAttribute("aria-modal", "true");
		container.setAttribute("aria-label", "Data Manager");

		container.innerHTML = `
			<div class="data-modal-card">
				<header class="data-modal-header">
					<div class="modal-hdr-title-group">
						<span class="hdr-icon">💾</span>
						<h3 data-i18n="dataModal.title">Backup & Restore</h3>
					</div>
					<button type="button" class="btn-close-modal" id="btnCloseDataModal" aria-label="Close Modal">&times;</button>
				</header>

				<nav class="data-modal-tabs">
					<button type="button" class="tab-btn active" data-tab="backup">
						<span>📥</span> <span data-i18n="dataModal.tabBackup">बैकअप (Export)</span>
					</button>
					<button type="button" class="tab-btn" data-tab="restore">
						<span>📤</span> <span data-i18n="dataModal.tabRestore">रीस्टोर (Import)</span>
					</button>
					<button type="button" class="tab-btn" data-tab="reset">
						<span>🗑️</span> <span data-i18n="dataModal.tabReset">रीसेट (Reset)</span>
					</button>
				</nav>

				<div class="data-modal-body">
					<!-- Alert Banner -->
					<div class="data-modal-alert" id="dataModalAlert"></div>

					<!-- Tab 1: Backup / Export -->
					<div class="data-tab-pane active" id="paneBackup">
						<div class="data-info-box">
							<p><strong data-i18n="dataModal.backupNoticeTitle">100% ऑफ़लाइन और सुरक्षित:</strong></p>
							<p data-i18n="dataModal.backupNoticeDesc">आपकी प्रोफ़ाइल (नाम, एनरोलमेंट, स्टडी सेंटर), प्रोजेक्ट सिनॉप्सिस फ़ील्ड्स और दोनों डिजिटल हस्ताक्षर एक सुरक्षित <code>.json</code> फ़ाइल में डाउनलोड होंगे।</p>
						</div>

						<div class="data-summary-preview" id="currentProfileSummary">
							<div class="summary-hdr" data-i18n="dataModal.currentDataTitle">वर्तमान प्रोफ़ाइल सारांश:</div>
							<div class="summary-grid">
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblStudent">छात्र:</span>
									<span class="val" id="summaryCurName">—</span>
								</div>
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblEnrolment">एनरोलमेंट:</span>
									<span class="val" id="summaryCurEnrolment">—</span>
								</div>
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblStudentSig">छात्र हस्ताक्षर:</span>
									<span class="val" id="summaryCurStudentSig">नहीं</span>
								</div>
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblGuideSig">गाइड हस्ताक्षर:</span>
									<span class="val" id="summaryCurGuideSig">नहीं</span>
								</div>
							</div>
						</div>

						<div class="data-modal-actions">
							<button type="button" class="modal-btn btn-primary" id="btnDownloadBackup">
								<span>📥</span> <span data-i18n="dataModal.btnDownload">बैकअप फ़ाइल डाउनलोड करें (JSON)</span>
							</button>
						</div>
					</div>

					<!-- Tab 2: Restore / Import -->
					<div class="data-tab-pane" id="paneRestore">
						<input type="file" id="inputBackupFile" accept=".json" style="display:none;">

						<div class="data-file-dropzone" id="dropzoneRestore">
							<div class="dropzone-icon">📁</div>
							<div class="dropzone-title" data-i18n="dataModal.dropzoneTitle">बैकअप (.json) फ़ाइल चुनें या यहाँ खींचें</div>
							<div class="dropzone-desc" data-i18n="dataModal.dropzoneDesc">केवल आधिकारिक IGNOU बैकअप फ़ाइलें (अधिकतम 3 MB)</div>
						</div>

						<!-- Selected File Summary Preview Card -->
						<div class="data-summary-preview" id="restoreFileSummary" style="display:none;">
							<div class="summary-hdr" data-i18n="dataModal.fileFoundTitle">बैकअप फ़ाइल में मिला डेटा:</div>
							<div class="summary-grid">
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblStudent">छात्र:</span>
									<span class="val" id="restoreSumName">—</span>
								</div>
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblEnrolment">एनरोलमेंट:</span>
									<span class="val" id="restoreSumEnrolment">—</span>
								</div>
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblDate">बैकअप तिथि:</span>
									<span class="val" id="restoreSumDate">—</span>
								</div>
								<div class="grid-item">
									<span class="label" data-i18n="dataModal.lblFieldsCount">फ़ील्ड्स:</span>
									<span class="val" id="restoreSumCount">—</span>
								</div>
							</div>
						</div>

						<!-- Actions available after file validated -->
						<div class="data-modal-actions" id="restoreActions" style="display:none;">
							<button type="button" class="modal-btn btn-primary" id="btnRestoreOverwrite">
								<span>⚡</span> <span data-i18n="dataModal.btnOverwrite">Replace All (पूर्ण रीस्टोर)</span>
							</button>
							<button type="button" class="modal-btn btn-secondary" id="btnRestoreMerge">
								<span>🔀</span> <span data-i18n="dataModal.btnMerge">Smart Merge (केवल रिक्त भरें)</span>
							</button>
						</div>
					</div>

					<!-- Tab 3: Reset All Data -->
					<div class="data-tab-pane" id="paneReset">
						<div class="data-info-box danger-box">
							<p><strong data-i18n="dataModal.resetWarnTitle">⚠️ सावधानी:</strong></p>
							<p data-i18n="dataModal.resetWarnDesc">यह क्रिया ब्राउज़र से आपका छात्र प्रोफ़ाइल, प्रोजेक्ट डेटा, सेटिंग्स और दोनों हस्ताक्षर हमेशा के लिए हटा देगी। रीसेट करने से पहले बैकअप डाउनलोड कर लें!</p>
						</div>

						<div class="data-modal-actions">
							<button type="button" class="modal-btn btn-danger" id="btnClearAllData">
								<span>🗑️</span> <span data-i18n="dataModal.btnClearAll">सारा डेटा साफ़ करें (Reset)</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		`;

		document.body.appendChild(container);

		this.#dom = {
			backdrop: container,
			btnClose: container.querySelector("#btnCloseDataModal"),
			tabBtns: container.querySelectorAll(".data-modal-tabs .tab-btn"),
			panes: {
				backup: container.querySelector("#paneBackup"),
				restore: container.querySelector("#paneRestore"),
				reset: container.querySelector("#paneReset"),
			},
			alertBox: container.querySelector("#dataModalAlert"),
			// Backup Elements
			curName: container.querySelector("#summaryCurName"),
			curEnrolment: container.querySelector("#summaryCurEnrolment"),
			curStudentSig: container.querySelector("#summaryCurStudentSig"),
			curGuideSig: container.querySelector("#summaryCurGuideSig"),
			btnDownload: container.querySelector("#btnDownloadBackup"),
			// Restore Elements
			fileInput: container.querySelector("#inputBackupFile"),
			dropzone: container.querySelector("#dropzoneRestore"),
			restoreSummaryCard: container.querySelector("#restoreFileSummary"),
			restoreSumName: container.querySelector("#restoreSumName"),
			restoreSumEnrolment: container.querySelector("#restoreSumEnrolment"),
			restoreSumDate: container.querySelector("#restoreSumDate"),
			restoreSumCount: container.querySelector("#restoreSumCount"),
			restoreActions: container.querySelector("#restoreActions"),
			btnRestoreOverwrite: container.querySelector("#btnRestoreOverwrite"),
			btnRestoreMerge: container.querySelector("#btnRestoreMerge"),
			// Reset Elements
			btnClearAll: container.querySelector("#btnClearAllData"),
		};

		this.#bindEvents();
	}

	static #bindEvents() {
		// Close modal on click of close button or clicking outside card
		this.#dom.btnClose.addEventListener("click", () => this.close());
		this.#dom.backdrop.addEventListener("click", (e) => {
			if (e.target === this.#dom.backdrop) this.close();
		});

		// Close modal on ESC key
		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.#dom?.backdrop.classList.contains("active")) {
				this.close();
			}
		});

		// Tab Switching
		this.#dom.tabBtns.forEach((btn) => {
			btn.addEventListener("click", () => {
				const tabKey = btn.dataset.tab;
				this.#switchTab(tabKey);
			});
		});

		// Export Button
		this.#dom.btnDownload.addEventListener("click", () => {
			try {
				const res = DataManagerService.exportBackupFile();
				this.#showAlert(`✅ बैकअप फ़ाइल सफलतापूर्वक डाउनलोड हो गई: ${res.filename}`, "success");
			} catch (e) {
				this.#showAlert(`❌ बैकअप में त्रुटि: ${e.message}`, "error");
			}
		});

		// Dropzone click triggers hidden file input
		this.#dom.dropzone.addEventListener("click", () => {
			this.#dom.fileInput.value = "";
			this.#dom.fileInput.click();
		});

		// Drag & Drop handlers
		this.#dom.dropzone.addEventListener("dragover", (e) => {
			e.preventDefault();
			this.#dom.dropzone.classList.add("dragover");
		});

		this.#dom.dropzone.addEventListener("dragleave", () => {
			this.#dom.dropzone.classList.remove("dragover");
		});

		this.#dom.dropzone.addEventListener("drop", (e) => {
			e.preventDefault();
			this.#dom.dropzone.classList.remove("dragover");
			const file = e.dataTransfer?.files?.[0];
			if (file) this.#handleFileSelected(file);
		});

		// File Input change
		this.#dom.fileInput.addEventListener("change", (e) => {
			const file = e.target.files?.[0];
			if (file) this.#handleFileSelected(file);
		});

		// Restore Action: Overwrite
		this.#dom.btnRestoreOverwrite.addEventListener("click", () => {
			this.#executeRestore("overwrite");
		});

		// Restore Action: Merge
		this.#dom.btnRestoreMerge.addEventListener("click", () => {
			this.#executeRestore("merge");
		});

		// Clear All Data
		this.#dom.btnClearAll.addEventListener("click", () => {
			const confirmMsg = I18nService.locale === "hi"
				? "⚠️ क्या आप वाकई अपना सारा सहेजा हुआ डेटा और हस्ताक्षर मिटाना चाहते हैं?\n\nयह क्रिया वापस नहीं ली जा सकती!"
				: "⚠️ Are you sure you want to completely erase all saved profile data and signatures?\n\nThis action cannot be undone!";
			
			if (window.confirm(confirmMsg)) {
				DataManagerService.clearAllData();
				this.#showAlert("✅ सारा डेटा सफलतापूर्वक साफ़ कर दिया गया।", "success");
				setTimeout(() => this.close(), 1200);
			}
		});
	}

	static async #handleFileSelected(file) {
		this.#hideAlert();
		try {
			const res = await DataManagerService.validateBackupFile(file);
			this.#pendingPayload = res.payload;

			// Populate Preview Card
			this.#dom.restoreSumName.textContent = res.summary.name || "N/A";
			this.#dom.restoreSumEnrolment.textContent = res.summary.enrolment || "N/A";
			this.#dom.restoreSumDate.textContent = res.summary.exportedAt;
			this.#dom.restoreSumCount.textContent = `${res.summary.fieldCount} फ़ील्ड्स (हस्ताक्षर: ${res.summary.hasStudentSig ? "हाँ" : "नहीं"})`;

			this.#dom.restoreSummaryCard.style.display = "flex";
			this.#dom.restoreActions.style.display = "flex";
			this.#showAlert("✅ बैकअप फ़ाइल मान्य है। कृपया नीचे से रीस्टोर विकल्प चुनें।", "success");
		} catch (err) {
			this.#pendingPayload = null;
			this.#dom.restoreSummaryCard.style.display = "none";
			this.#dom.restoreActions.style.display = "none";
			this.#showAlert(`❌ ${err.message}`, "error");
		}
	}

	static #executeRestore(mode) {
		if (!this.#pendingPayload) return;

		try {
			const res = DataManagerService.restorePayload(this.#pendingPayload, mode);
			const modeLabel = mode === "overwrite" ? "पूर्ण रीस्टोर (Overwrite)" : "स्मार्ट मर्ज (Merge)";
			this.#showAlert(`🎉 डेटा सफलतापूर्वक रीस्टोर हो गया (${modeLabel}): ${res.updatedCount} फ़ील्ड्स अपडेट किए गए!`, "success");

			setTimeout(() => {
				this.close();
			}, 1300);
		} catch (e) {
			this.#showAlert(`❌ रीस्टोर में त्रुटि: ${e.message}`, "error");
		}
	}

	static #switchTab(tabKey) {
		this.#activeTab = tabKey;
		this.#hideAlert();

		this.#dom.tabBtns.forEach((btn) => {
			btn.classList.toggle("active", btn.dataset.tab === tabKey);
		});

		Object.entries(this.#dom.panes).forEach(([k, pane]) => {
			if (pane) pane.classList.toggle("active", k === tabKey);
		});

		if (tabKey === "backup") {
			this.#refreshCurrentSummary();
		}
	}

	static #refreshCurrentSummary() {
		const name = StorageService.get("field_Name", "") || "रिक्त";
		const enrolment = StorageService.get("field_Enrolment", "") || "रिक्त";
		const hasStudentSig = !!StorageService.get("signature_webp", null);
		const hasGuideSig = !!StorageService.get("guide_signature_webp", null);

		this.#dom.curName.textContent = name;
		this.#dom.curEnrolment.textContent = enrolment;
		this.#dom.curStudentSig.textContent = hasStudentSig ? "सहेजा गया" : "नहीं";
		this.#dom.curGuideSig.textContent = hasGuideSig ? "सहेजा गया" : "नहीं";
	}

	static #showAlert(msg, type = "success") {
		if (!this.#dom.alertBox) return;
		this.#dom.alertBox.className = `data-modal-alert active alert-${type}`;
		this.#dom.alertBox.textContent = msg;
	}

	static #hideAlert() {
		if (!this.#dom.alertBox) return;
		this.#dom.alertBox.className = "data-modal-alert";
		this.#dom.alertBox.textContent = "";
	}

	/**
	 * Opens Data Manager modal
	 */
	static open(defaultTab = "backup") {
		this.#ensureMounted();
		I18nService.translatePage(this.#dom.backdrop);
		this.#switchTab(defaultTab);
		this.#dom.backdrop.classList.add("active");
	}

	/**
	 * Closes Data Manager modal
	 */
	static close() {
		if (this.#dom?.backdrop) {
			this.#dom.backdrop.classList.remove("active");
			this.#hideAlert();
		}
	}
}

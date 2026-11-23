/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND FOR IGNOU DOCUCRAFT
 * =========================================================================
 * Single Responsibility: Manages 4 dedicated tabs in your Google Sheet:
 * 1. "Page_Visits"      -> Tracks unique visits for each individual page
 * 2. "Synopsis_Forms"   -> Tracks print counts for each of the 4 synopsis forms
 * 3. "Assignment_Courses"-> Tracks print counts for each individual course code
 * 4. "Feedback"         -> Collects star ratings, name/course, and student suggestions
 *
 * HOW TO DEPLOY:
 * 1. Create a blank Google Sheet in your Google Drive (e.g. "IGNOU_DocuCraft_Telemetry").
 * 2. Click Extensions > Apps Script in Google Sheets.
 * 3. Delete any default code, paste this entire file, and click Save (💾).
 * 4. Click "Deploy" > "New Deployment" (Top Right).
 * 5. Select type: "Web app".
 * 6. Execute as: "Me", Who has access: "Anyone".
 * 7. Click Deploy, copy the Web App URL, and paste it in `app/js/shared/analytics.service.js`!
 * =========================================================================
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;

  // 1. ACTION: TRACK PAGE VISITS
  if (action === "visit") {
    var sheet = ss.getSheetByName("Page_Visits");
    if (!sheet) {
      sheet = ss.insertSheet("Page_Visits");
      sheet.appendRow(["Metric / Page", "Total Visits", "Description"]);
      sheet.appendRow(["total_visitors", 1, "Total site-wide unique sessions (Footer Badge)"]);
      sheet.appendRow(["page_home", 0, "Home page visits"]);
      sheet.appendRow(["page_assignment_covers", 0, "Assignment covers studio visits"]);
      sheet.appendRow(["page_project_synopsis", 0, "Project synopsis studio visits"]);
      sheet.appendRow(["page_help", 0, "Help guide page visits"]);
      sheet.appendRow(["page_about", 0, "About page visits"]);
      sheet.setFrozenRows(1);
    }

    var isNew = e.parameter.isNew === "1";
    var data = sheet.getDataRange().getValues();
    var totalVisitors = 1;

    // Increment overall total visitors if new session
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === "total_visitors") {
        totalVisitors = Number(data[i][1]) + (isNew ? 1 : 0);
        if (isNew) sheet.getRange(i + 1, 2).setValue(totalVisitors);
        break;
      }
    }

    // Increment specific page visit
    var page = e.parameter.page || "home";
    var pageKey = "page_" + page;
    var foundPage = false;

    for (var j = 1; j < data.length; j++) {
      if (data[j][0] === pageKey) {
        sheet.getRange(j + 1, 2).setValue(Number(data[j][1]) + 1);
        foundPage = true;
        break;
      }
    }
    if (!foundPage) {
      sheet.appendRow([pageKey, 1, page + " page visits"]);
    }

    return ContentService.createTextOutput(JSON.stringify({ totalVisitors: totalVisitors }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. ACTION: TRACK SYNOPSIS FORMS PRINT
  if (action === "print_synopsis") {
    var synSheet = ss.getSheetByName("Synopsis_Forms");
    if (!synSheet) {
      synSheet = ss.insertSheet("Synopsis_Forms");
      synSheet.appendRow(["Form ID", "Official Form Name", "Total Printed", "Last Printed"]);
      synSheet.appendRow(["doc_proforma", "Annexure II: Proforma for Approval", 0, "-"]);
      synSheet.appendRow(["doc_trainee_letter", "Project Trainee Request Letter", 0, "-"]);
      synSheet.appendRow(["doc_originality", "Annexure X: Certificate of Originality", 0, "-"]);
      synSheet.appendRow(["doc_project_cover", "Annexure XI: Project Cover Page", 0, "-"]);
      synSheet.setFrozenRows(1);
    }

    var docsParam = (e.parameter.docs || "").trim();
    if (docsParam) {
      var docList = docsParam.split(",").map(function(s) { return s.trim(); });
      var synData = synSheet.getDataRange().getValues();
      var nowStr = new Date().toLocaleString();

      docList.forEach(function(docId) {
        var foundDoc = false;
        for (var r = 1; r < synData.length; r++) {
          if (synData[r][0] === docId) {
            synSheet.getRange(r + 1, 3).setValue(Number(synData[r][2]) + 1);
            synSheet.getRange(r + 1, 4).setValue(nowStr);
            foundDoc = true;
            break;
          }
        }
        if (!foundDoc) {
          synSheet.appendRow([docId, "Custom Document", 1, nowStr]);
        }
      });
    }

    return ContentService.createTextOutput("OK");
  }

  // 3. ACTION: TRACK ASSIGNMENT COURSE COVERS PRINT
  if (action === "print_assignment") {
    var courseSheet = ss.getSheetByName("Assignment_Courses");
    if (!courseSheet) {
      courseSheet = ss.insertSheet("Assignment_Courses");
      courseSheet.appendRow(["Course Code", "Total Printed", "Last Printed"]);
      courseSheet.setFrozenRows(1);
    }

    var coursesParam = (e.parameter.courses || "").trim();
    if (coursesParam) {
      var courseList = coursesParam.split(",").map(function(s) { return s.trim(); });
      var courseData = courseSheet.getDataRange().getValues();
      var timestampStr = new Date().toLocaleString();

      courseList.forEach(function(courseCode) {
        var foundCourse = false;
        for (var c = 1; c < courseData.length; c++) {
          if (courseData[c][0] === courseCode) {
            courseSheet.getRange(c + 1, 2).setValue(Number(courseData[c][1]) + 1);
            courseSheet.getRange(c + 1, 3).setValue(timestampStr);
            foundCourse = true;
            break;
          }
        }
        if (!foundCourse) {
          courseSheet.appendRow([courseCode, 1, timestampStr]);
        }
      });
    }

    return ContentService.createTextOutput("OK");
  }

  return ContentService.createTextOutput("IGNOU DocuCraft API Ready");
}

// 4. ACTION: COLLECT STUDENT FEEDBACK (POST)
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var feedSheet = ss.getSheetByName("Feedback");
  if (!feedSheet) {
    feedSheet = ss.insertSheet("Feedback");
    feedSheet.appendRow(["Timestamp", "Rating (1-5)", "Name / Course", "Feedback Message"]);
    feedSheet.setFrozenRows(1);
  }

  try {
    var data = JSON.parse(e.postData.contents);
    feedSheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.rating || 5,
      data.name || "Anonymous",
      data.message || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

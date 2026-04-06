// Improved Code.gs for Google Apps Script
// Copy and paste this into your Apps Script editor.

const SHEET_ID = '1R1spomhfaw74iMW9b9Fmq7ZxR5E3uVRjCK5nCjZKh5U'; 
const UPLOAD_FOLDER_ID = '1VM8SbnzEFxRgL-cdbQyHup_XXlDUTnGr';

// Handle Incoming Requests (POST)
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No data received");
    }
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let response = {};

    if (action === 'register') {
      response = registerUser(data);
    } else if (action === 'login') {
      response = loginUser(data);
    } else if (action === 'upload') {
      response = uploadFile(data);
    } else if (action === 'getFiles') {
      response = getUserFiles(data);
    } else {
      response = { success: false, message: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.log("Global Error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Critical Server Error: " + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- CORE FUNCTIONS ---

function getSheet(name) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    if (!ss) throw new Error("Could not open spreadsheet with ID: " + SHEET_ID);
    
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      console.log("Created new sheet: " + name);
    }
    return sheet;
  } catch (error) {
    console.log("Error in getSheet(" + name + "): " + error.toString());
    return null;
  }
}

function registerUser(data) {
  if (!data || !data.email) {
    return {success: false, message: "No data provided"};
  }

  const lock = LockService.getScriptLock();
  try {
    // Wait for up to 30 seconds for other processes to finish.
    // This prevents race conditions when 50+ people register simultaneously.
    lock.waitLock(30000);

    const sheet = getSheet('Users');
    const users = sheet.getDataRange().getValues();
    
    // Check duplicates
    for(let i=1; i<users.length; i++){
      if(users[i][2] == data.email) {
        return {success: false, message: "Email already exists in our records!"};
      }
    }

    // Username Logic
    // users.length is safe here because we have the lock
    let prefix = "ABC-K-S_"; // Default
    if (data.delType === "Alumni") {
      prefix = "ABC-K-A_";
    } else if (data.delType === "WBAP") {
      prefix = "ABC-K-WB_";
    } else if (data.delType === "PGT") {
      prefix = "ABC-K-P_";
    } else if (data.amount >= 1000) {
      prefix = "ABC-K-P_";
    }

    let username = prefix + (1000 + users.length); 

    sheet.appendRow([
      username, 
      data.name, 
      data.email, 
      data.phone, 
      data.institution, 
      data.city, 
      data.password, 
      data.delType, 
      data.amount, 
      data.paymentId, 
      data.cmeChoice || "", 
      new Date()
    ]);

    // PGT Approval File Handling
    if (data.delType === "PGT" && data.pgtFile) {
      try {
        const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
        const fileName = "PGT_Approval_" + username + "_" + data.pgtFile.fileName;
        const blob = Utilities.newBlob(Utilities.base64Decode(data.pgtFile.base64), data.pgtFile.mimeType, fileName);
        const file = folder.createFile(blob);
        
        const approvalSheet = getSheet('approvals');
        approvalSheet.appendRow([username, data.name, data.email, file.getUrl(), new Date()]);
        console.log("PGT Approval saved for " + username);
      } catch (fileError) {
        console.log("Failed to save PGT approval file: " + fileError.toString());
      }
    }

    // Send email AFTER recording to sheet to ensure data is safe first
    try {
      sendConfirmationEmail(data, username, data.delType || "Standard");
    } catch (emailError) {
      console.log("Email failed but registration saved: " + emailError.toString());
    }

    return {success: true, message: "Registered! ID: " + username};

  } catch (e) {
    console.log("Error in registerUser: " + e.toString());
    return {success: false, message: "Registration failed: " + e.toString()};
  } finally {
    lock.releaseLock();
  }
}

function sendConfirmationEmail(data, username, delType) {
  let subject = "Registration Confirmation - ABC Children's Conclave 2026";
  let to = data.email;
  let cc = "mukherjeerohit301@gmail.com,apollobostonconclave2026@gmail.com";
  let body = `Dear ${data.name},\n\n` + 
               `Thank you for registering for the ABC Children's Conclave 2026.\n\n` +
               `Your registration details are as follows:\n` +
               `Registration ID: ${username}\n` +
               `Phone No: ${data.phone}\n` +
               `Amount Paid: ₹${data.amount}\n\n` +
               `We look forward to welcoming you to the conclave!\n\n` +
               `Best Regards,\nConference Secretariat\nABC Children's Conclave`;

  // Custom logic for Alumni
  if (delType === "Alumni") {
    subject = "Registration Confirmation - ABC Children's Conclave 2026";
    // You can change 'to' or 'cc' here specifically for alumni
    cc = "apollobostonconclave2026@gmail.com,mukherjeerohit301@gmail.com,apahari@yahoo.com,avishek_pd@rediffmail.com"; // Different CC for Alumni
    body = `Dear ${data.name},\n\n` +
           `Welcome back! As an Apollo Alumnus, we are delighted to have you join us for the ABC Children's Conclave 2026. We have received your registration details.\n\n` +
           `Your alumni registration details:\n` +
           `Registration ID: ${username}\n` +
            `Phone No: ${data.phone}\n` +
           `Email: ${data.email}\n` +
           `To Confirm your registration please reach out to Dr. Amitava Pahari at apahari@yahoo.com or Dr. Avishek Poddar at avishek_pd@rediffmail.com\n\n` +
           `See you at the conclave!\n\n` +
           `Best Regards,\nEvent Support Team\nABC Children's Conclave 2026`;
  }
  
  if (delType === "WBAP") {
  subject = "Registration Confirmation - ABC Children's Conclave 2026";
  // You can change 'to' or 'cc' here specifically for alumni
  cc = "apollobostonconclave2026@gmail.com,mukherjeerohit301@gmail.com,apahari@yahoo.com,avishek_pd@rediffmail.com,mailcb@gmail.com"; // Different CC for Alumni
  body = `Dear ${data.name},\n\n` +
          `Warm greetings from Apollo Children’s, Apollo Multispecialty Hospitals, Kolkata.\n` +
          `We are pleased to inform you that your registration for the ABC Children’s Conclave 2026 has been successfully received under the WBAP EB/OB Member category.\n\n` +
          `Your registration details:\n` +
          `Registration ID: ${username}\n` +
          `Phone No: ${data.phone}\n` +
          `Email: ${data.email}\n\n` +
          `To confirm your registration, kindly reach out to:\n`+
          `Dr. Chandreyee Bhattacharya - mailcb@gmail.com\n` +
          `Dr. Amitava Pahari – apahari@yahoo.com\n` +
          `Dr. Avishek Poddar – avishek_pd@rediffmail.com\n\n` +
          `We are delighted to have your participation and look forward to welcoming you to this academic gathering.\n\n` +
          `See you at the conclave!\n\n` +
          `Best Regards,\nEvent Support Team\nABC Children's Conclave 2026`;
  }
  MailApp.sendEmail({
    to: to,
    cc: cc,
    subject: subject,
    body: body
  });
}

function loginUser(data) {
  const sheet = getSheet('Users');
  const users = sheet.getDataRange().getValues();

  for(let i=1; i<users.length; i++){
    // Check Email (Index 2) and Password (Index 6)
    if(users[i][2] == data.email && users[i][6] == data.password){
      return {
        success: true, 
        token: users[i][0], // UserID
        name: users[i][1],
        type: users[i][7] // Corrected index for userType (Column H)
      };
    }
  }
  return {success: false, message: "Invalid Credentials"};
}

function uploadFile(data) {
  try {
    const folder = DriveApp.getFolderById(UPLOAD_FOLDER_ID);
    const blob = Utilities.newBlob(Utilities.base64Decode(data.fileData), data.mimeType, data.fileName);
    const file = folder.createFile(blob);
    
    const sheet = getSheet('Files');
    sheet.appendRow([file.getId(), data.userId, data.fileName, file.getUrl(), new Date()]);
    
    return {success: true, message: "Uploaded"};
  } catch (e) {
    return {success: false, message: "Upload failed: " + e.toString()};
  }
}

function getUserFiles(data) {
  try {
    const sheet = getSheet('Files');
    const rows = sheet.getDataRange().getValues();
    let files = [];

    for(let i=1; i<rows.length; i++){
      if(rows[i][1] == data.userId){
        files.push({ name: rows[i][2], url: rows[i][3], date: rows[i][4] });
      }
    }
    return {success: true, files: files};
  } catch (e) {
    return {success: false, message: "Error fetching files: " + e.toString()};
  }
}

// --- BACKGROUND PROCESSING ---

/**
 * Periodically checks for forwarded Razorpay emails to catch payments 
 * that failed to register on the website due to technical glitches.
 * 
 * Set this to run on a Time-based Trigger (e.g., every 10 or 15 minutes).
 */
function processForwardedPayments() {
  const sheet = getSheet('Users');
  if (!sheet) {
    console.log("Error: Could not access 'Users' sheet in processForwardedPayments");
    return;
  }
  
  const lastRow = sheet.getLastRow();
  
  let existingPayments = [];
  if (lastRow > 1) {
    const range = sheet.getRange(2, 10, lastRow - 1, 1);
    const values = range ? range.getValues() : [];
    existingPayments = values.flat().filter(String);
  }

  // Setup a label to track processed emails
  const labelName = "Conclave_Processed";
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) { 
    label = GmailApp.createLabel(labelName); 
  }

  // Search for forwarded emails from Razorpay
  // Note: Rohit's emails are forwarded, so we look for this specific subject
  const threads = GmailApp.search('subject:"Razorpay | Payment successful for Abckol26" -label:' + labelName + ' newer_than:1d');
  const now = new Date().getTime();

  console.log(`Found ${threads.length} unprocessed payment threads.`);

  threads.forEach(function(thread) {
    const messages = thread.getMessages();
    const latestMessage = messages[messages.length - 1]; 
    const messageTime = latestMessage.getDate().getTime();

    // Check if 5 minutes have passed since the email was received
    // This gives the main system time to process the real-time registration first
    if ((now - messageTime) >= (5 * 60 * 1000)) {
      const body = latestMessage.getPlainBody();

      // Extract customer email and payment ID
      const emailMatch = body.match(/Customer Details[\s\S]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const paymentMatch = body.match(/pay_[A-Za-z0-9]+/);

      if (emailMatch && paymentMatch) {
        const customerEmail = emailMatch[1];
        const paymentID = paymentMatch[0];

        // If the Payment ID is NOT found in our Sheet
        if (!existingPayments.includes(paymentID)) {
          console.log(`Mismatch found! Payment ${paymentID} not in sheet for ${customerEmail}. Sending notification.`);
          
          const emailSubject = "Action Required: Registration Pending - ABC Children's Conclave 2026";
          const emailBody = `Dear Delegate,\n\n` +
                            `We have successfully received your payment (ID: ${paymentID}). However, your registration is currently pending in our system due to a technical glitch during the process.\n\n` +
                            `Please contact our support team at apollobostonconclave2026@gmail.com with your payment ID to finalize your registration details.\n\n` +
                            `Thank you for your patience.\n\n` +
                            `Best Regards,\nEvent Support Team\nABC Children's Conclave 2026`;

          GmailApp.sendEmail(customerEmail, emailSubject, emailBody, {
            name: "ABC Conclave Support",
            cc: "apollobostonconclave2026@gmail.com"
          });
        }
      }
      
      // Mark the thread as processed regardless of whether an email was sent
      thread.addLabel(label);
    }
  });
}

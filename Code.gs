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
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // You might want to add headers here if it's a new sheet
  }
  return sheet;
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
    let userType = data.amount >= 1000 ? "PREMIUM" : "STANDARD"; 
    let prefix = userType === "PREMIUM" ? "ABC-K-P_" : "ABC-K-S_";
    let username = prefix + (1000 + users.length); 

    sheet.appendRow([
      username, 
      data.name, 
      data.email, 
      data.phone, 
      data.institution, 
      data.city, 
      data.password, 
      userType, 
      data.amount, 
      data.paymentId, 
      data.cmeChoice || "", 
      new Date()
    ]);

    // Send email AFTER recording to sheet to ensure data is safe first
    try {
      sendConfirmationEmail(data, username);
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

function sendConfirmationEmail(data, username) {
  const subject = "Registration Confirmation - ABC Children's Conclave 2026";
  const body = `Dear ${data.name},\n\n` + 
               `Thank you for registering for the ABC Children's Conclave 2026.\n\n` +
               `Your registration details are as follows:\n` +
               `Registration ID: ${username}\n` +
               `Amount Paid: ₹${data.amount}\n\n` +
               `We look forward to welcoming you to the conclave!\n\n` +
               `Best Regards,\nConference Secretariat\nABC Children's Conclave`;
  
  MailApp.sendEmail({
    to: data.email,
    cc: "mukherjeerohit301@gmail.com,apollobostonconclave2026@gmail.com",
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
  const lastRow = sheet.getLastRow();
  
  let existingPayments = [];
  if (lastRow > 1) {
    const values = sheet.getRange(2, 10, lastRow - 1, 1).getValues();
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

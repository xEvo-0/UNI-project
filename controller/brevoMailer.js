const { BrevoClient } = require("@getbrevo/brevo");
const otpSchema = require("../model/schema/otpSchema");
require("dotenv").config();

// Initialize the Brevo Client
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY || "YOUR_BREVO_API_KEY"
});

function generate5DigitNumber() {
  return Math.floor(10000 + Math.random() * 90000);
}

//--------------------------------------------------------------------------------------------

const otpMail = async (email) => {
  try {
    let otp = generate5DigitNumber();
    console.log(`=== Development Mode OTP for ${email}: ${otp} ===`);
    await otpSchema.findOneAndUpdate(
      { email: email },
      { otp: otp, createdAt: Date.now() },
      { upsert: true, new: true } 
    );

    const senderEmail = process.env.Email || "no-reply@university.edu";

    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "University Assignment Portal", email: senderEmail },
      to: [{ email: email }],
      subject: "[University Assignment Portal] — Your Verification Code (OTP)",

      textContent: `[University Assignment Portal] — Verification Code

Use the one-time passcode (OTP) below to continue your action on the Assignment Portal:

OTP: ${otp}

This code will expire in 10 minutes. If you did not request this code, please ignore this email or contact support@university.edu.

Thank you,
[University Assignment Portal] IT & Assignments Team`,

      htmlContent: `
             <!doctype html>
                <html>
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width,initial-scale=1" />
                </head>
                <body style="margin:0;padding:0;font-family:Inter, Arial, sans-serif;background:#f3f4f6;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding:30px 16px;">
                        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px rgba(16,24,40,0.08);">

                          <tr>
                            <td style="padding:24px 32px;border-bottom:1px solid #e6e7eb;background:linear-gradient(to right, #4b49e5, #6366f1);color:#ffffff;">
                              <table width="100%">
                                <tr>
                                  <td style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.5px;">Security OTP</td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:32px;">
                              <h1 style="margin:0 0 12px 0;font-size:20px;color:#111827;">Your verification code</h1>

                              <p style="margin:0 0 20px 0;color:#374151;font-size:15px;line-height:1.5;">
                                Use the one-time passcode below to verify your action on the 
                                <em>Assignment Portal</em>.
                              </p>

                              <div style="margin:20px 0;padding:18px 22px;border-radius:8px;background:#f9fafb;display:inline-block;">
                                <p style="margin:0;font-size:22px;letter-spacing:4px;font-weight:600;color:#0f172a;">
                                  ${otp}
                                </p>
                                <p style="margin:6px 0 0 0;font-size:13px;color:#6b7280;">Expires in 10 minutes</p>
                              </div>

                              <p style="margin:22px 0 0 0;color:#6b7280;font-size:13px;line-height:1.5;">
                                If you didn't request this code, please ignore this email or contact 
                                <a href="mailto:support@university.edu" style="color:#1f6feb;text-decoration:none;">
                                  support@university.edu
                                </a>.
                              </p>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:18px 32px;background:#fafafa;border-top:1px solid #eef2f7;color:#9ca3af;font-size:12px;">
                              <div style="margin-bottom:6px;">Assignment Portal • IT Department</div>
                              <div>© 2025 University. All rights reserved.</div>
                            </td>
                          </tr>

                        </table>

                        <div style="max-width:600px;margin:12px auto 0;color:#9ca3af;font-size:12px;text-align:center;">
                          This is an automated message — please do not reply.
                        </div>

                      </td>
                    </tr>
                  </table>
                </body>
                </html>
              `
    });
    console.log("OTP Email sent successfully, messageId:", response.messageId);
  }
  catch (err) {
    console.error("Email sending unsuccessful via Brevo:", err.message || err);
  }
};

//---------------------------------------------------------------------------------------------

const remarkMail = async (remarkBy, remark, email, status, category = "Assignment", title = "Untitled") => {
  try {
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const itemType = category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : "Submission";
    
    const subject = `[University Assignment Portal] — Your ${itemType} "${title}" has been ${capitalizedStatus} by ${remarkBy}`;
    const senderEmail = process.env.Email || "no-reply@university.edu";

    const isApproved = status.toLowerCase() === "approved";
    const badgeBgColor = isApproved ? "#ecfdf5" : "#fef2f2";
    const badgeTextColor = isApproved ? "#047857" : "#b91c1c";
    const borderAccentColor = isApproved ? "#10b981" : "#ef4444";

    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "University Assignment Portal", email: senderEmail },
      to: [{ email: email }],
      subject: subject,

      textContent: `
[University Assignment Portal] — Submission Status Notification

Hello,

Your ${itemType.toLowerCase()} "${title}" has been ${status.toLowerCase()} by ${remarkBy}.

Status: ${capitalizedStatus}
Reviewed By: ${remarkBy}
Remarks: ${remark || 'None'}

Please check your dashboard for further details.

Thank you,
Assignment Portal Team
      `,

      htmlContent: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Submission Status Notification</title>
      </head>
      <body style="margin:0;padding:0;font-family:system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;background-color:#f8fafc;color:#1e293b;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:30px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.04);border:1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                  <td style="padding:24px 32px;border-bottom:1px solid #f1f5f9;background:linear-gradient(to right, #4b49e5, #6366f1);color:#ffffff;">
                    <table width="100%">
                      <tr>
                        <td style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:-0.5px;">Status Update</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">Submission Evaluation Result</h2>
                    
                    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#475569;">
                      Hello, your submitted <strong>${itemType.toLowerCase()}</strong> has been reviewed. Here are the evaluation details:
                    </p>

                    <!-- Details Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;border-left:4px solid ${borderAccentColor};">
                      <tr>
                        <td style="padding:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                            <tr>
                              <td style="padding-bottom:10px;font-size:13px;font-weight:600;color:#64748b;width:120px;">Document Title</td>
                              <td style="padding-bottom:10px;font-size:14px;font-weight:700;color:#0f172a;">${title}</td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;font-size:13px;font-weight:600;color:#64748b;">Document Type</td>
                              <td style="padding-bottom:10px;font-size:14px;font-weight:600;color:#334155;">${itemType}</td>
                            </tr>
                            <tr>
                              <td style="padding-bottom:10px;font-size:13px;font-weight:600;color:#64748b;">Reviewed By</td>
                              <td style="padding-bottom:10px;font-size:14px;font-weight:600;color:#334155;">${remarkBy}</td>
                            </tr>
                            <tr>
                              <td style="font-size:13px;font-weight:600;color:#64748b;">Decision Status</td>
                              <td>
                                <span style="display:inline-block;padding:4px 12px;font-size:12px;font-weight:800;text-transform:uppercase;border-radius:9999px;background-color:${badgeBgColor};color:${badgeTextColor};">
                                  ${capitalizedStatus}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Remarks Section -->
                    <div style="margin-bottom:24px;">
                      <h4 style="margin:0 0 8px 0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#475569;">Remarks & Feedback</h4>
                      <div style="padding:16px 20px;background-color:#f8fafc;border-radius:10px;border:1px solid #f1f5f9;font-size:14px;line-height:1.6;color:#334155;font-style:italic;">
                        "${remark || 'No feedback remarks provided.'}"
                      </div>
                    </div>

                    <p style="margin:24px 0 0 0;font-size:13px;color:#64748b;line-height:1.5;">
                      Please sign in to the portal to view full feedback or proceed with any necessary next steps. For inquiries, reach out to <a href="mailto:support@university.edu" style="color:#4b49e5;text-decoration:none;font-weight:500;">support@university.edu</a>.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #f1f5f9;color:#94a3b8;font-size:12px;">
                    <div style="margin-bottom:4px;font-weight:600;color:#64748b;">University Assignment Portal • IT Department</div>
                    <div>© 2025 University. All rights reserved.</div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `
    });

    console.log("Remark email sent successfully via Brevo, messageId:", response.messageId);
  } catch (err) {
    console.error("Error sending remark email via Brevo:", err.message || err);
  }
};

module.exports = { otpMail, remarkMail };

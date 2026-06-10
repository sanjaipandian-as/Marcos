"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const env_js_1 = __importDefault(require("../config/env.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const db_js_1 = __importDefault(require("../config/db.js"));
const email_service_js_1 = __importDefault(require("./email.service.js"));
const twilio_1 = __importDefault(require("twilio"));
let twilioClient = null;
const isTwilioConfigured = env_js_1.default.TWILIO_ACCOUNT_SID &&
    env_js_1.default.TWILIO_AUTH_TOKEN &&
    env_js_1.default.TWILIO_PHONE_NUMBER &&
    env_js_1.default.TWILIO_ACCOUNT_SID !== 'ACtwilio' &&
    env_js_1.default.TWILIO_AUTH_TOKEN !== 'authkey' &&
    env_js_1.default.TWILIO_PHONE_NUMBER !== '+123456789';
if (isTwilioConfigured) {
    try {
        twilioClient = (0, twilio_1.default)(env_js_1.default.TWILIO_ACCOUNT_SID, env_js_1.default.TWILIO_AUTH_TOKEN);
    }
    catch (err) {
        logger_js_1.default.error('Failed to initialize Twilio client:', { metadata: { error: err.message } });
    }
}
class SmsService {
    /**
     * Send an SMS message by forwarding it to the user's email via SMTP.
     * Falls back to console logging if no email is linked to the phone number.
     */
    static async sendSms(to, message) {
        if (twilioClient) {
            try {
                const info = await twilioClient.messages.create({
                    body: message,
                    from: env_js_1.default.TWILIO_PHONE_NUMBER,
                    to,
                });
                logger_js_1.default.info(`[TWILIO SMS SENT] To: ${to} | MessageSid: ${info.sid}`);
                return { success: true, messageSid: info.sid };
            }
            catch (err) {
                logger_js_1.default.error('Twilio SMS delivery failed. Falling back to SMTP/Logs.', { metadata: { error: err.message } });
            }
        }
        try {
            // Find user by phone number
            const user = await db_js_1.default.user.findFirst({
                where: {
                    phoneNumber: to,
                },
            });
            if (user && user.email) {
                // Forward message to user's email via SMTP
                logger_js_1.default.info(`[SMTP FORWARD] Routing SMS to User Email: ${user.email} (Phone: ${to})`);
                const codeMatch = message.match(/\b\d{6}\b/);
                let emailHtml = '';
                let subject = 'MARCOS Studio Notification';
                if (codeMatch && message.toLowerCase().includes('verification')) {
                    const code = codeMatch[0];
                    subject = 'Your MARCOS Verification Code';
                    emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 40px 20px; text-align: center;">
              <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eaeaea; text-align: left;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #111111, #333333); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px;">MARCOS</h1>
                  <p style="color: #aaaaaa; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Secure Authorization</p>
                </div>
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <h2 style="color: #222222; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Hello,</h2>
                  <p style="color: #555555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    A request has been made to log in or verify your identity with **MARCOS Studio**. Please use the secure one-time verification code (OTP) below to complete your sign-in.
                  </p>
                  
                  <!-- OTP Box -->
                  <div style="background-color: #f4f6f8; border-radius: 8px; padding: 25px; text-align: center; margin-bottom: 30px; border: 1px solid #eef2f5;">
                    <span style="display: block; color: #777777; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Verification Code</span>
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; color: #111111; letter-spacing: 6px; display: inline-block;">${code}</span>
                  </div>

                  <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0 0 20px 0;">
                    This code is highly sensitive and is valid for the next **5 minutes**. For your own security, do not share this code with anyone, including the MARCOS support team.
                  </p>
                  <p style="color: #999999; font-size: 13px; line-height: 1.5; margin: 0;">
                    If you did not request this code, you can safely ignore this email. Your account remains secure.
                  </p>
                </div>
                <!-- Footer -->
                <div style="background-color: #f4f6f8; padding: 25px 30px; text-align: center; border-top: 1px solid #eaeaea;">
                  <p style="color: #222222; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">MARCOS Bespoke Tailoring Studio</p>
                  <p style="color: #888888; font-size: 12px; margin: 0 0 15px 0;">Premium Customized Design & Fittings</p>
                  <p style="color: #bbbbbb; font-size: 11px; margin: 0; line-height: 1.4;">
                    This is an automated security transmission. Please do not reply directly to this email.<br />
                    &copy; 2026 MARCOS Studio. All Rights Reserved.
                  </p>
                </div>
              </div>
            </div>
          `;
                }
                else {
                    emailHtml = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 40px 20px; text-align: center;">
              <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eaeaea; text-align: left;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #111111, #333333); padding: 25px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px;">MARCOS</h1>
                </div>
                <!-- Content -->
                <div style="padding: 30px 25px;">
                  <h2 style="color: #222222; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">MARCOS Studio Alert</h2>
                  <p style="color: #555555; font-size: 14px; line-height: 1.5; margin: 0;">${message}</p>
                </div>
                <!-- Footer -->
                <div style="background-color: #f4f6f8; padding: 20px 25px; text-align: center; border-top: 1px solid #eaeaea;">
                  <p style="color: #222222; font-size: 13px; font-weight: 600; margin: 0 0 5px 0;">MARCOS Bespoke Tailoring Studio</p>
                  <p style="color: #bbbbbb; font-size: 11px; margin: 0; line-height: 1.4;">
                    This message was routed to your email instead of SMS.<br />
                    &copy; 2026 MARCOS Studio. All Rights Reserved.
                  </p>
                </div>
              </div>
            </div>
          `;
                }
                await email_service_js_1.default.sendEmail(user.email, subject, message, emailHtml);
                return { success: true, forwardedTo: user.email };
            }
            // If user not found, log to console
            logger_js_1.default.info(`[MOCK SMS] To: ${to} | Message: ${message}`);
            return { success: true, mock: true };
        }
        catch (error) {
            logger_js_1.default.error('Failed to route SMS via SMTP email', { metadata: { error: error.message } });
            return { success: false, error: error.message };
        }
    }
}
exports.SmsService = SmsService;
exports.default = SmsService;

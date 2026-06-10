"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const env_js_1 = __importDefault(require("../config/env.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    /**
     * Send an email. Falls back to console log if SMTP settings are not fully set or are placeholders.
     */
    static async sendEmail(to, subject, text, html, templateId, templateData) {
        const isMock = !env_js_1.default.SMTP_HOST ||
            !env_js_1.default.SMTP_PORT ||
            !env_js_1.default.SMTP_USER ||
            !env_js_1.default.SMTP_PASS ||
            env_js_1.default.SMTP_USER === 'smtp-user-placeholder';
        if (isMock) {
            logger_js_1.default.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Template: ${templateId || 'None'}`, {
                metadata: { templateData, text, html },
            });
            return { success: true, mock: true };
        }
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: env_js_1.default.SMTP_HOST,
                port: env_js_1.default.SMTP_PORT,
                secure: env_js_1.default.SMTP_PORT === 465, // true for 465, false for other ports
                auth: {
                    user: env_js_1.default.SMTP_USER,
                    pass: env_js_1.default.SMTP_PASS,
                },
            });
            const info = await transporter.sendMail({
                from: env_js_1.default.SMTP_FROM || 'noreply@marcosapp.com',
                to,
                subject,
                text,
                html: html || text,
            });
            logger_js_1.default.info(`[EMAIL SENT] To: ${to} | Subject: ${subject} | MessageId: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        }
        catch (error) {
            logger_js_1.default.error('Failed to send email via SMTP', { metadata: { error: error.message } });
            throw error;
        }
    }
}
exports.EmailService = EmailService;
exports.default = EmailService;

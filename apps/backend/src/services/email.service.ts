import env from '../config/env.js';
import logger from '../utils/logger.js';
import nodemailer from 'nodemailer';

export class EmailService {
  /**
   * Send an email. Falls back to console log if SMTP settings are not fully set or are placeholders.
   */
  static async sendEmail(to: string, subject: string, text: string, html?: string, templateId?: string, templateData?: any) {
    const isMock = 
      !env.SMTP_HOST || 
      !env.SMTP_PORT || 
      !env.SMTP_USER || 
      !env.SMTP_PASS || 
      env.SMTP_USER === 'smtp-user-placeholder';

    if (isMock) {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Template: ${templateId || 'None'}`, {
        metadata: { templateData, text, html },
      });
      return { success: true, mock: true };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: env.SMTP_FROM || 'noreply@marcosapp.com',
        to,
        subject,
        text,
        html: html || text,
      });

      logger.info(`[EMAIL SENT] To: ${to} | Subject: ${subject} | MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      logger.error('Failed to send email via SMTP', { metadata: { error: error.message } });
      throw error;
    }
  }
}

export default EmailService;

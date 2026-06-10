import logger from '../utils/logger.js';
import env from '../config/env.js';
import prisma from '../config/db.js';
import admin from 'firebase-admin';

let isFirebaseConfigured = false;
let messaging: admin.messaging.Messaging | null = null;

if (
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_PRIVATE_KEY
) {
  try {
    const formattedPrivateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey,
      }),
    });
    messaging = admin.messaging();
    isFirebaseConfigured = true;
    logger.info('Firebase Admin SDK initialized successfully for FCM.');
  } catch (err: any) {
    logger.error('Failed to initialize Firebase Admin SDK:', { metadata: { error: err.message } });
  }
}

export class NotificationService {
  /**
   * Dispatch a Firebase Cloud Messaging push notification.
   */
  static async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (user && user.fcmToken) {
        if (isFirebaseConfigured && messaging) {
          try {
            const response = await messaging.send({
              token: user.fcmToken,
              notification: { title, body },
              data,
            });
            logger.info(`[FCM PUSH SENT] User: ${userId} | MessageId: ${response}`);
            return { success: true, messageId: response };
          } catch (err: any) {
            logger.error(`FCM Push notification failed for user ${userId}. Falling back to logs.`, {
              metadata: { error: err.message },
            });
          }
        }
      }
    } catch (dbErr: any) {
      logger.error(`Database error fetching user FCM token for user ${userId}:`, {
        metadata: { error: dbErr.message },
      });
    }

    // Fallback: Console Logging
    logger.info(`[FCM PUSH MOCK] User: ${userId} | Title: ${title} | Body: ${body}`, {
      metadata: { data },
    });
    return { success: true, mock: true };
  }
}

export default NotificationService;

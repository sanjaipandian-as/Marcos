"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const env_js_1 = __importDefault(require("../config/env.js"));
const db_js_1 = __importDefault(require("../config/db.js"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
let isFirebaseConfigured = false;
let messaging = null;
if (env_js_1.default.FIREBASE_PROJECT_ID &&
    env_js_1.default.FIREBASE_CLIENT_EMAIL &&
    env_js_1.default.FIREBASE_PRIVATE_KEY) {
    try {
        const formattedPrivateKey = env_js_1.default.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: env_js_1.default.FIREBASE_PROJECT_ID,
                clientEmail: env_js_1.default.FIREBASE_CLIENT_EMAIL,
                privateKey: formattedPrivateKey,
            }),
        });
        messaging = firebase_admin_1.default.messaging();
        isFirebaseConfigured = true;
        logger_js_1.default.info('Firebase Admin SDK initialized successfully for FCM.');
    }
    catch (err) {
        logger_js_1.default.error('Failed to initialize Firebase Admin SDK:', { metadata: { error: err.message } });
    }
}
class NotificationService {
    /**
     * Dispatch a Firebase Cloud Messaging push notification.
     */
    static async sendPushNotification(userId, title, body, data) {
        try {
            const user = await db_js_1.default.user.findUnique({
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
                        logger_js_1.default.info(`[FCM PUSH SENT] User: ${userId} | MessageId: ${response}`);
                        return { success: true, messageId: response };
                    }
                    catch (err) {
                        logger_js_1.default.error(`FCM Push notification failed for user ${userId}. Falling back to logs.`, {
                            metadata: { error: err.message },
                        });
                    }
                }
            }
        }
        catch (dbErr) {
            logger_js_1.default.error(`Database error fetching user FCM token for user ${userId}:`, {
                metadata: { error: dbErr.message },
            });
        }
        // Fallback: Console Logging
        logger_js_1.default.info(`[FCM PUSH MOCK] User: ${userId} | Title: ${title} | Body: ${body}`, {
            metadata: { data },
        });
        return { success: true, mock: true };
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;

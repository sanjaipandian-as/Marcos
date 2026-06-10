"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.R2Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_js_1 = __importDefault(require("../config/env.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let s3Client = null;
if (env_js_1.default.CLOUDFLARE_R2_ACCESS_KEY &&
    env_js_1.default.CLOUDFLARE_R2_SECRET_KEY &&
    env_js_1.default.CLOUDFLARE_R2_ENDPOINT &&
    env_js_1.default.CLOUDFLARE_R2_ACCESS_KEY !== 'r2-access-key') {
    s3Client = new client_s3_1.S3Client({
        region: 'auto',
        endpoint: env_js_1.default.CLOUDFLARE_R2_ENDPOINT,
        credentials: {
            accessKeyId: env_js_1.default.CLOUDFLARE_R2_ACCESS_KEY,
            secretAccessKey: env_js_1.default.CLOUDFLARE_R2_SECRET_KEY,
        },
    });
}
class R2Service {
    /**
     * Uploads a file buffer to Cloudflare R2. Falls back to local storage if R2 is not configured.
     */
    static async uploadFile(buffer, key, mimeType) {
        if (s3Client && env_js_1.default.CLOUDFLARE_R2_BUCKET) {
            try {
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: env_js_1.default.CLOUDFLARE_R2_BUCKET,
                    Key: key,
                    Body: buffer,
                    ContentType: mimeType,
                });
                await s3Client.send(command);
                // Constructed R2 public or private endpoint URL
                const domain = env_js_1.default.CLOUDFLARE_R2_ENDPOINT.replace('https://', '').split('/')[0];
                return `https://${env_js_1.default.CLOUDFLARE_R2_BUCKET}.${domain}/${key}`;
            }
            catch (error) {
                logger_js_1.default.error('Failed to upload file to Cloudflare R2. Falling back to local.', { metadata: { error: error.message } });
            }
        }
        // Local Storage Fallback
        try {
            const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads');
            if (!fs_1.default.existsSync(uploadsDir)) {
                fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            }
            const fileName = `${Date.now()}-${key.replace(/\//g, '_')}`;
            const filePath = path_1.default.join(uploadsDir, fileName);
            fs_1.default.writeFileSync(filePath, buffer);
            return `http://localhost:${env_js_1.default.PORT}/uploads/${fileName}`;
        }
        catch (error) {
            logger_js_1.default.error('Local file upload fallback failed', { metadata: { error: error.message } });
            throw error;
        }
    }
    /**
     * Deletes a file from Cloudflare R2 or local storage.
     */
    static async deleteFile(fileUrl) {
        if (fileUrl.includes('/uploads/')) {
            // Local delete
            try {
                const fileName = fileUrl.split('/uploads/')[1];
                const filePath = path_1.default.join(process.cwd(), 'uploads', fileName);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
            catch (error) {
                logger_js_1.default.error('Failed to delete local file', { metadata: { error: error.message } });
            }
            return;
        }
        if (s3Client && env_js_1.default.CLOUDFLARE_R2_BUCKET) {
            try {
                // Extract key from URL
                const urlObj = new URL(fileUrl);
                const key = urlObj.pathname.substring(1); // remove leading slash
                const command = new client_s3_1.DeleteObjectCommand({
                    Bucket: env_js_1.default.CLOUDFLARE_R2_BUCKET,
                    Key: key,
                });
                await s3Client.send(command);
            }
            catch (error) {
                logger_js_1.default.error('Failed to delete file from Cloudflare R2', { metadata: { error: error.message } });
            }
        }
    }
}
exports.R2Service = R2Service;
exports.default = R2Service;

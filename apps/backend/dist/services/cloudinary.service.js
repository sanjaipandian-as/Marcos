"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_js_1 = __importDefault(require("../config/env.js"));
const logger_js_1 = __importDefault(require("../utils/logger.js"));
class CloudinaryService {
    /**
     * Uploads a file buffer to Cloudinary using their REST API (base64 JSON payload).
     */
    static async uploadFile(buffer, folder = 'marcos', mimeType = 'image/jpeg') {
        if (!env_js_1.default.CLOUDINARY_CLOUD_NAME || !env_js_1.default.CLOUDINARY_API_KEY || !env_js_1.default.CLOUDINARY_API_SECRET) {
            throw new Error('Cloudinary credentials are not configured.');
        }
        try {
            const timestamp = Math.round(new Date().getTime() / 1000);
            // We sign the parameters folder and timestamp
            const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
            const signature = crypto_1.default
                .createHash('sha1')
                .update(paramsToSign + env_js_1.default.CLOUDINARY_API_SECRET)
                .digest('hex');
            // Convert buffer to data URI
            const base64File = `data:${mimeType};base64,${buffer.toString('base64')}`;
            // POST to the upload endpoint
            const url = `https://api.cloudinary.com/v1_1/${env_js_1.default.CLOUDINARY_CLOUD_NAME}/auto/upload`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file: base64File,
                    folder,
                    timestamp,
                    api_key: env_js_1.default.CLOUDINARY_API_KEY,
                    signature,
                }),
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Cloudinary API responded with status ${response.status}: ${errText}`);
            }
            const result = await response.json();
            if (!result.secure_url) {
                throw new Error('Upload succeeded but secure_url was not returned.');
            }
            return result.secure_url;
        }
        catch (error) {
            logger_js_1.default.error('Cloudinary upload error:', { metadata: { error: error.message } });
            throw error;
        }
    }
    /**
     * Deletes a file from Cloudinary using its public ID.
     */
    static async deleteFile(fileUrl) {
        if (!env_js_1.default.CLOUDINARY_CLOUD_NAME || !env_js_1.default.CLOUDINARY_API_KEY || !env_js_1.default.CLOUDINARY_API_SECRET) {
            return;
        }
        try {
            // Extract public ID from Cloudinary URL
            // e.g. https://res.cloudinary.com/dvpseognq/image/upload/v1234567890/marcos/public_id.jpg
            const urlParts = fileUrl.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            if (uploadIndex === -1)
                return;
            let pathParts = urlParts.slice(uploadIndex + 1);
            if (pathParts[0].startsWith('v') && !isNaN(Number(pathParts[0].substring(1)))) {
                pathParts = pathParts.slice(1);
            }
            const fullPublicId = pathParts.join('/');
            const lastDotIndex = fullPublicId.lastIndexOf('.');
            const publicId = lastDotIndex !== -1 ? fullPublicId.substring(0, lastDotIndex) : fullPublicId;
            const timestamp = Math.round(new Date().getTime() / 1000);
            const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
            const signature = crypto_1.default
                .createHash('sha1')
                .update(paramsToSign + env_js_1.default.CLOUDINARY_API_SECRET)
                .digest('hex');
            const url = `https://api.cloudinary.com/v1_1/${env_js_1.default.CLOUDINARY_CLOUD_NAME}/image/destroy`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    public_id: publicId,
                    timestamp,
                    api_key: env_js_1.default.CLOUDINARY_API_KEY,
                    signature,
                }),
            });
            if (!response.ok) {
                const errText = await response.text();
                logger_js_1.default.error(`Cloudinary deletion failed: ${errText}`);
            }
        }
        catch (error) {
            logger_js_1.default.error('Failed to delete file from Cloudinary:', { metadata: { error: error.message } });
        }
    }
}
exports.CloudinaryService = CloudinaryService;
exports.default = CloudinaryService;

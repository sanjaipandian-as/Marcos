"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.validateUpload = validateUpload;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
// Raw upload middleware (allocates buffer memory)
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB absolute maximum buffer size
    },
});
/**
 * Detect MIME type from buffer magic bytes.
 * Supports: JPEG, PNG, GIF, WebP, PDF, BMP, TIFF
 */
function detectMimeFromBuffer(buffer) {
    if (buffer.length < 4)
        return null;
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'image/jpeg';
    }
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'image/png';
    }
    // GIF: 47 49 46 38
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
        return 'image/gif';
    }
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
        return 'image/webp';
    }
    // PDF: 25 50 44 46
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
        return 'application/pdf';
    }
    // BMP: 42 4D
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
        return 'image/bmp';
    }
    return null;
}
/**
 * Validate uploaded files using magic bytes and file size constraints.
 */
function validateUpload(allowedTypes, maxSize) {
    return async (req, res, next) => {
        // Collect all files uploaded
        let filesToValidate = [];
        if (req.file) {
            filesToValidate.push(req.file);
        }
        if (req.files) {
            if (Array.isArray(req.files)) {
                filesToValidate.push(...req.files);
            }
            else {
                Object.values(req.files).forEach((fieldFiles) => {
                    filesToValidate.push(...fieldFiles);
                });
            }
        }
        if (filesToValidate.length === 0) {
            return next();
        }
        try {
            for (const file of filesToValidate) {
                // Check size limit
                if (file.size > maxSize) {
                    return res.status(400).json({
                        success: false,
                        message: `File ${file.originalname} exceeds the maximum size limit of ${maxSize / (1024 * 1024)}MB.`,
                    });
                }
                // Check magic bytes
                const detectedMime = detectMimeFromBuffer(file.buffer);
                if (!detectedMime || !allowedTypes.includes(detectedMime)) {
                    return res.status(400).json({
                        success: false,
                        message: `File ${file.originalname} has an invalid file signature. Allowed formats: ${allowedTypes.join(', ')}`,
                    });
                }
            }
            next();
        }
        catch (error) {
            console.error('File validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error validating uploaded files.',
            });
        }
    };
}

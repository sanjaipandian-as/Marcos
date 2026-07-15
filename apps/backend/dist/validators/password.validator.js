"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = validatePassword;
function validatePassword(password, context) {
    if (password.length < 10) {
        throw new Error("ValidationError: Password must be at least 10 characters.");
    }
    if (context?.email) {
        const emailPrefix = context.email.split("@")[0].toLowerCase();
        if (password.toLowerCase().includes(emailPrefix) && emailPrefix.length > 3) {
            throw new Error("ValidationError: Password must not contain your email prefix.");
        }
    }
    if (context?.fullName) {
        const names = context.fullName.toLowerCase().split(/\s+/).filter((n) => n.length > 3);
        for (const name of names) {
            if (password.toLowerCase().includes(name)) {
                throw new Error("ValidationError: Password must not contain your name.");
            }
        }
    }
}

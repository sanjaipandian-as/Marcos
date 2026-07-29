"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = validatePassword;
const COMMON_PASSWORDS = new Set([
    'password', 'password1', 'password123', '123456', '12345678', '123456789',
    '1234567890', 'qwerty', 'abc123', 'monkey', 'master', 'dragon', 'login',
    'princess', 'qwertyuiop', 'solo', 'passw0rd', 'starwars', 'letmein',
    'football', 'iloveyou', 'admin', 'welcome', 'hello', 'charlie', 'donald',
    'trustno1', 'batman', 'access', 'thunder', 'matrix', '1qaz2wsx',
]);
function validatePassword(password, context) {
    if (password.length < 10) {
        throw new Error("ValidationError: Password must be at least 10 characters.");
    }
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
        throw new Error("ValidationError: This password is too common. Please choose a stronger password.");
    }
    if (!/[A-Z]/.test(password)) {
        throw new Error("ValidationError: Password must contain at least one uppercase letter.");
    }
    if (!/[0-9]/.test(password)) {
        throw new Error("ValidationError: Password must contain at least one number.");
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

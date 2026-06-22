"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
async function main() {
    const BASE_URL = 'http://localhost:5000/api/v1';
    console.log("1. Logging in as Admin...");
    const loginRes = await axios_1.default.post(`${BASE_URL}/auth/login`, {
        email: 'marcos@admin.com',
        password: 'Marcos@admin123'
    });
    const token = loginRes.data.accessToken;
    console.log("Logged in successfully. Token: " + token.substring(0, 15) + "...");
    console.log("\n2. Fetching /appointments?limit=100...");
    const apptsRes = await axios_1.default.get(`${BASE_URL}/appointments?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Status Code:", apptsRes.status);
    console.log("Success:", apptsRes.data.success);
    console.log("Total returned:", apptsRes.data.data.length);
    console.log("\nAll appointments in response:");
    apptsRes.data.data.forEach((appt) => {
        console.log(`ID: ${appt.id}, User: ${appt.user?.fullName}, Date: ${appt.date}, Slot: ${appt.timeSlot}, Notes: ${appt.notes}`);
    });
}
main().catch(console.error);

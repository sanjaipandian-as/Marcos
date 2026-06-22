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
    console.log("Logged in successfully.");
    console.log("\n2. Fetching /admin/dashboard (default, should be last week)...");
    let res = await axios_1.default.get(`${BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Status:", res.status);
    console.log("Success:", res.data.success);
    console.log("Selected Week Start:", res.data.data.selectedWeekStart);
    console.log("Available Weeks:", JSON.stringify(res.data.data.availableWeeks, null, 2));
    console.log("Day of Week Pattern:", JSON.stringify(res.data.data.timeBasedPatterns.dayOfWeekPattern, null, 2));
    console.log("Weekly Comparison:", JSON.stringify(res.data.data.timeBasedPatterns.weeklyComparison, null, 2));
    if (res.data.data.availableWeeks && res.data.data.availableWeeks.length > 0) {
        const firstWeek = res.data.data.availableWeeks[0].start;
        console.log(`\n3. Fetching /admin/dashboard?weekStart=${firstWeek} (This Week)...`);
        res = await axios_1.default.get(`${BASE_URL}/admin/dashboard?weekStart=${firstWeek}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Selected Week Start:", res.data.data.selectedWeekStart);
        console.log("Day of Week Pattern:", JSON.stringify(res.data.data.timeBasedPatterns.dayOfWeekPattern, null, 2));
    }
}
main().catch(console.error);

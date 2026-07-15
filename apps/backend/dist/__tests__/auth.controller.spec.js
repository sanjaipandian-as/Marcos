"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = __importDefault(require("../app.js"));
const db_js_1 = __importDefault(require("../config/db.js"));
describe('POST /auth/login - null password invariant', () => {
    beforeAll(async () => {
        // Clear user table for clean state
        await db_js_1.default.user.deleteMany({ where: { email: { contains: 'test' } } });
    });
    afterAll(async () => {
        await db_js_1.default.user.deleteMany({ where: { email: { contains: 'test' } } });
    });
    it('rejects login for admin-created user with no password, given empty string', async () => {
        const user = await db_js_1.default.user.create({
            data: {
                email: 'test_admin_created@example.com',
                phoneNumber: '+919999999999',
                fullName: 'Test User',
                role: 'CUSTOMER',
                referralCode: 'TEST1234',
                // @ts-ignore - IDE TS cache issue
                passwordHash: null,
            },
        });
        const res = await (0, supertest_1.default)(app_js_1.default).post('/api/v1/auth/login').send({ email: user.email, password: '' });
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('SETUP_REQUIRED');
    });
    it('rejects login for admin-created user with no password, given any guessed password', async () => {
        const res = await (0, supertest_1.default)(app_js_1.default).post('/api/v1/auth/login').send({ email: 'test_admin_created@example.com', password: 'anything123' });
        expect(res.status).toBe(403);
        expect(res.body.message).toBe('SETUP_REQUIRED');
    });
    it('rejects login given SQL-injection-style payloads', async () => {
        const res = await (0, supertest_1.default)(app_js_1.default)
            .post('/api/v1/auth/login')
            .send({ email: 'test_admin_created@example.com', password: "' OR '1'='1" });
        expect(res.status).toBe(403);
    });
    it('exhibits constant-time behavior for checkIdentifier across valid and invalid users', async () => {
        // Valid user
        await db_js_1.default.user.create({
            data: {
                email: 'test_timing_valid@example.com',
                phoneNumber: '+919999999998',
                fullName: 'Timing User',
                role: 'CUSTOMER',
                referralCode: 'TIMING123',
                passwordHash: '$2b$10$C8.w1N/bY.W/F8e8uO/3k.U5EwKqZ6M3v/Zz1L6C.m3J0XwX7.F.m', // valid bcrypt hash format
            },
        });
        const runCheck = async (email) => {
            const start = process.hrtime.bigint();
            await (0, supertest_1.default)(app_js_1.default).post('/api/v1/auth/login/check').send({ identifier: email });
            const end = process.hrtime.bigint();
            return Number(end - start) / 1000000; // in ms
        };
        // Warm-up
        await runCheck('test_timing_valid@example.com');
        await runCheck('non_existent_timing@example.com');
        // Run N times
        let validTimeTotal = 0;
        let invalidTimeTotal = 0;
        const iterations = 5;
        for (let i = 0; i < iterations; i++) {
            validTimeTotal += await runCheck('test_timing_valid@example.com');
            invalidTimeTotal += await runCheck('non_existent_timing@example.com');
        }
        const avgValid = validTimeTotal / iterations;
        const avgInvalid = invalidTimeTotal / iterations;
        // The delta should be small (e.g., within 50ms)
        const delta = Math.abs(avgValid - avgInvalid);
        expect(delta).toBeLessThan(50);
    });
});

# 🔒 MARCOS Platform — Security Audit Report

**Date:** July 25, 2026  
**Scope:** Full backend (`apps/backend`), environment config, auth flow, middleware, routes  
**Methodology:** Manual static analysis across OWASP Top 10 categories

---

## Overall Security Rating: **6.5 / 10** — "Solid Foundation, Critical Gaps"

```
████████████████████░░░░░░░░░░  6.5/10
```

The codebase demonstrates above-average security awareness (Argon2, Refresh Token Rotation, audit logging, Zod validation, rate limiting). However, there are **critical issues in secrets management and JWT configuration** that would be deal-breakers in a production deployment.

---

## Summary Scorecard

| Security Domain               | Rating | Severity of Issues |
|-------------------------------|--------|--------------------|
| 🔑 Secrets Management         | 2/10   | 🔴 CRITICAL        |
| 🔐 Authentication & JWT       | 7/10   | 🟡 MEDIUM          |
| 🛡️ Password Hashing           | 9/10   | 🟢 LOW             |
| 🔒 Encryption (AES-256-GCM)   | 7/10   | 🟡 MEDIUM          |
| 🌐 CORS Configuration         | 7/10   | 🟡 MEDIUM          |
| ⏱️ Rate Limiting              | 7/10   | 🟡 MEDIUM          |
| ✅ Input Validation (Zod)     | 8/10   | 🟢 LOW             |
| 👤 RBAC & Authorization       | 9/10   | 🟢 LOW             |
| ❌ Error Handling              | 8/10   | 🟢 LOW             |
| 📁 File Upload Security       | 8/10   | 🟢 LOW             |
| 🔌 WebSocket Security         | 7/10   | 🟢 LOW             |
| 💳 Webhook Verification       | 6/10   | 🟡 MEDIUM          |

---

## 1. 🔑 Secrets Management — 🔴 CRITICAL (2/10)

> [!CAUTION]
> This is the single biggest security risk in the entire project. Multiple **real production secrets** are hardcoded in `.env` files on disk.

### Issues Found

#### 1a. Real Database Credentials in `.env`
Both [.env](file:///d:/Zippy/MARCOS/.env) (root) and [.env](file:///d:/Zippy/MARCOS/apps/backend/.env) (backend) contain **real** Neon PostgreSQL connection strings with passwords:

```
DATABASE_URL="postgresql://neondb_owner:npg_J58ykfenbAiU@ep-sparkling-smoke-ao12339g..."
```

#### 1b. Real Redis Credentials
```
REDIS_URL="redis://default:gQAAAAAAAT-iAAIgcDE3MTY0OWI3YTdmZGI0MGU5OGY5YmQzMmRlOTI2OWU4Zg@immense-zebra-81826.upstash.io:6379"
```

#### 1c. Real SMTP Credentials (Gmail App Password)
```
SMTP_USER="sanjaipandian.as@gmail.com"
SMTP_PASS="suoe xxwz effa hsjs"
```

#### 1d. Real Cloudinary API Credentials
```
CLOUDINARY_API_KEY="664582727338475"
CLOUDINARY_API_SECRET="y8mSd-tN_XhrSW8I7GqxKkQ0sUQ"
```

#### 1e. Weak/Placeholder JWT Secrets
```
JWT_ACCESS_SECRET="super-secret-access-key-goes-here-and-is-long-enough"
JWT_REFRESH_SECRET="super-secret-refresh-key-goes-here-and-is-long-enough"
```
These are human-readable dictionary phrases. A determined attacker could brute-force or guess them.

#### 1f. Weak Encryption Key
```
ENCRYPTION_KEY="thisisareallysecure32charkeyinfo"
```
This is a readable English phrase — not a cryptographically random key.

### ✅ What's Done Right
- `.env` is in [.gitignore](file:///d:/Zippy/MARCOS/.gitignore) and is **not** currently tracked by Git

### 🔧 Remediation

| Priority | Action |
|----------|--------|
| **P0** | Rotate ALL secrets immediately (DB password, Redis password, SMTP app password, Cloudinary keys) |
| **P0** | Generate cryptographically random JWT secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| **P0** | Generate a random AES encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **P1** | Use a secrets manager (e.g., Doppler, Vault, Render's env vars) for production — never store real secrets in local `.env` files |
| **P1** | Add `.env.example` with placeholder values to the repo instead |

---

## 2. 🔐 Authentication & JWT — 🟡 MEDIUM (7/10)

### ✅ What's Done Right
- **Refresh Token Rotation (RTR)** with reuse detection in [auth.service.ts](file:///d:/Zippy/MARCOS/apps/backend/src/services/auth.service.ts#L72-L127) — industry best practice
- **Token family tracking** with automatic invalidation on breach detection
- **SuperAdmin email alerts** on token reuse
- **Access token blacklisting** on logout via Redis
- **httpOnly + Secure + SameSite cookies** for web refresh tokens in [auth.controller.ts](file:///d:/Zippy/MARCOS/apps/backend/src/controllers/auth.controller.ts#L287-L293)
- **User existence re-verification** on each authenticated request in [auth.middleware.ts](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/auth.middleware.ts#L91-L109)
- **Constant-time check** in `checkIdentifier` to prevent user enumeration via timing attack in [auth.controller.ts](file:///d:/Zippy/MARCOS/apps/backend/src/controllers/auth.controller.ts#L314-L354)
- **Brute-force login protection** with progressive blocking (10 fails → 15 min lockout)

### Issues Found

#### 2a. JWT secret is a weak phrase (see Section 1e)
The `env.ts` schema only requires `z.string().min(8)` for JWT secrets — 8 characters is dangerously low.

#### 2b. `req.user` populated from JWT payload without fresh DB lookup on every request for role
In [auth.middleware.ts:111](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/auth.middleware.ts#L111), `req.user = decoded` uses the JWT-embedded role. If an admin demotes a user, the old token retains the old role for up to 15 minutes.

#### 2c. Hardcoded SUPERADMIN email backdoor
In [auth.controller.ts:227](file:///d:/Zippy/MARCOS/apps/backend/src/controllers/auth.controller.ts#L227):
```typescript
role: (email === 'marcos@admin.com' || email === 'marcos@zippy.com') ? 'SUPERADMIN' : (role || 'CUSTOMER'),
```
Anyone registering with these emails automatically becomes SUPERADMIN.

#### 2d. Client-controlled `role` field in registration
The `registerSchema` accepts `role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN']).optional()` from the request body. A malicious client could send `role: "ADMIN"` to self-promote.

#### 2e. `/auth/refresh` has no rate limiting
In [auth.routes.ts:32](file:///d:/Zippy/MARCOS/apps/backend/src/routes/auth.routes.ts#L32), the refresh endpoint has no rate limiter attached.

### 🔧 Remediation

| Priority | Action |
|----------|--------|
| **P0** | Remove the hardcoded SUPERADMIN email backdoor — use a DB seed or admin CLI instead |
| **P0** | Remove `role` from the registration request body schema — always default to `CUSTOMER` |
| **P1** | Increase JWT secret minimum validation to `z.string().min(32)` |
| **P1** | Fetch fresh role from DB in `authenticate()` instead of trusting JWT claims for authorization |
| **P2** | Add rate limiting to `/auth/refresh` endpoint |

---

## 3. 🛡️ Password Hashing — 🟢 EXCELLENT (9/10)

### ✅ What's Done Right
- **Argon2id** with strong parameters in [crypto.ts](file:///d:/Zippy/MARCOS/apps/backend/src/utils/crypto.ts#L19-L26):
  - Memory: 64 MB
  - Time cost: 3 iterations
  - Parallelism: 4
- This is the **current gold standard** for password hashing (recommended by OWASP)
- Password validator in [password.validator.ts](file:///d:/Zippy/MARCOS/apps/backend/src/validators/password.validator.ts) checks against name and email

### Minor Issues
- `registerSchema` only requires `password: z.string().min(6)` while `setupPasswordSchema` requires `.min(10)`. These should be consistent.
- `password.validator.ts` doesn't check for common passwords (e.g., "password123")
- No uppercase/special character requirements

---

## 4. 🔒 Encryption (AES-256-GCM) — 🟡 MEDIUM (7/10)

### ✅ What's Done Right
- **AES-256-GCM** authenticated encryption in [crypto.ts](file:///d:/Zippy/MARCOS/apps/backend/src/utils/crypto.ts#L42-L57)
- Random 12-byte IV per encryption
- Auth tag verification on decryption
- SHA-256 key derivation fallback for non-32-byte keys

### Issues Found
- Encryption key is a readable English phrase (see Section 1f)
- `decryptText` returns the original ciphertext on failure ([crypto.ts:85](file:///d:/Zippy/MARCOS/apps/backend/src/utils/crypto.ts#L85)) — this silently swallows integrity failures, which defeats the purpose of authenticated encryption. If an auth tag doesn't match, you should **reject the data**, not return garbled output.

### 🔧 Remediation
- Throw an error on decryption failure instead of returning the encrypted string
- Use a proper 32-byte random key generated via `crypto.randomBytes(32)`

---

## 5. 🌐 CORS Configuration — 🟡 MEDIUM (7/10)

### ✅ What's Done Right
- Explicit origin whitelist in [app.ts:41-67](file:///d:/Zippy/MARCOS/apps/backend/src/app.ts#L41-L68)
- Credentials enabled only for known origins
- Helmet.js enabled for HTTP security headers

### Issues Found

#### 5a. All localhost origins allowed unconditionally
In [app.ts:57-58](file:///d:/Zippy/MARCOS/apps/backend/src/app.ts#L57-L59):
```typescript
if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
  return callback(null, true);
}
```
This runs in **all environments including production**. It should be gated behind `NODE_ENV !== 'production'`.

#### 5b. Requests with no `Origin` header are always allowed
```typescript
if (!origin) return callback(null, true);
```
While this is needed for mobile/Postman/health-checks, a malicious server-side request could exploit this.

### 🔧 Remediation
- Restrict localhost CORS to development only
- Consider stricter `crossOriginResourcePolicy` in production

---

## 6. ⏱️ Rate Limiting — 🟡 MEDIUM (7/10)

### ✅ What's Done Right
- Global rate limit (100 req / 15 min) in [rateLimit.middleware.ts](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/rateLimit.middleware.ts)
- Sensitive endpoint limiter (5 req / 15 min) with 15-minute auto-block
- Per-identifier (email/phone) + per-IP dual limiting
- OTP-specific rate limiting with progressive lockout (hourly limit + 60s cooldown + 24h lockout)

### Issues Found

#### 6a. Rate limiting disabled in development/test
In [rateLimit.middleware.ts:15](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/rateLimit.middleware.ts#L15):
```typescript
if (env.NODE_ENV === 'test' || env.NODE_ENV === 'development') {
  return next();
}
```
Understandable for DX, but means dev/staging environments have zero protection.

#### 6b. Fail-open on Redis errors
```typescript
catch (error) {
  console.error('Rate limit error:', error);
  next(); // Fail open
}
```
If Redis goes down, all rate limiting is silently disabled.

#### 6c. Global limit of 100 req/15min is very aggressive
Legitimate users browsing the app could hit this quickly, especially on pages with multiple API calls.

### 🔧 Remediation
- Consider raising the global limit to 300-500 for authenticated users
- Add a fallback in-memory rate limiter when Redis is unavailable
- Log when failing open so monitoring can alert

---

## 7. ✅ Input Validation — 🟢 GOOD (8/10)

### ✅ What's Done Right
- **Zod schemas** on all major endpoints in [validate.middleware.ts](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/validate.middleware.ts)
- Request body, query, and params are all validated
- Parsed values replace raw `req.body` — preventing type coercion attacks
- UUIDs validated with `z.string().uuid()`

### Minor Issues
- The validate middleware logs the full request payload on validation errors ([validate.middleware.ts:20](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/validate.middleware.ts#L20)), which could log passwords in plain text
- Not all controller endpoints have validation schemas (e.g., some admin intelligence endpoints accept unvalidated query params)

### 🔧 Remediation
- Redact sensitive fields (`password`, `newPassword`, `code`) before logging validation errors
- Add query param schemas for pagination/filtering endpoints

---

## 8. 👤 RBAC & Authorization — 🟢 EXCELLENT (9/10)

### ✅ What's Done Right
- Clear role hierarchy: `CUSTOMER → STAFF → ADMIN → SUPERADMIN`
- All admin routes gated with `authenticate` + `authorize()` in [admin.routes.ts](file:///d:/Zippy/MARCOS/apps/backend/src/routes/admin.routes.ts)
- `Role.SUPERADMIN` required for role management
- **Audit logging** on unauthorized access attempts in [auth.middleware.ts:130-140](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/auth.middleware.ts#L130-L140)
- Staff have read-only access to customer/intelligence endpoints

### Minor Issue
- Voucher plan admin endpoints in [auth.routes.ts:52-54](file:///d:/Zippy/MARCOS/apps/backend/src/routes/auth.routes.ts#L52-L54) only require `authenticate` without `authorize` — any logged-in user can create/delete voucher plans

### 🔧 Remediation
- Add `authorize(Role.ADMIN, Role.SUPERADMIN)` to voucher plan admin routes

---

## 9. ❌ Error Handling — 🟢 GOOD (8/10)

### ✅ What's Done Right
- Global error middleware in [error.middleware.ts](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/error.middleware.ts)
- **Stack traces hidden in production**
- **Prisma/SQL errors sanitized** to generic message in production
- Structured logging via Winston
- `unhandledRejection` and `uncaughtException` handlers with graceful shutdown

### Minor Issues
- `err.details` is leaked even in production at [error.middleware.ts:42](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/error.middleware.ts#L42) — this could expose internal structure
- Health check at [system.routes.ts:22](file:///d:/Zippy/MARCOS/apps/backend/src/routes/system.routes.ts#L22) exposes `dbError.message` publicly, which could reveal database connection details

### 🔧 Remediation
- Gate `err.details` behind `NODE_ENV !== 'production'`
- Sanitize health check error messages in production

---

## 10. 📁 File Upload Security — 🟢 GOOD (8/10)

### ✅ What's Done Right
- **Magic byte validation** in [upload.middleware.ts](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/upload.middleware.ts) — doesn't trust file extensions
- 10 MB absolute file size limit
- Memory storage (no temp file writes)
- Allowlisted MIME types (JPEG, PNG, GIF, WebP only for images)
- Per-route size limits applied via `validateUpload()`

### Minor Issues
- Video upload route at [admin.routes.ts:36](file:///d:/Zippy/MARCOS/apps/backend/src/routes/admin.routes.ts#L36) has **no `validateUpload`** middleware — any file type/size could be uploaded as a "video"
- No virus/malware scanning on uploaded files

### 🔧 Remediation
- Add `validateUpload` to the video upload route with appropriate video MIME types and size limit
- Consider integrating a malware scanner (e.g., ClamAV) for production

---

## 11. 🔌 WebSocket Security — 🟢 GOOD (7/10)

### ✅ What's Done Right
- JWT authentication on handshake in [socket.handler.ts:49-68](file:///d:/Zippy/MARCOS/apps/backend/src/socket/socket.handler.ts#L49-L68)
- Token blacklist check
- RBAC room segregation (`user:`, `admins`, `superadmins`)
- CORS restricted to known origins in production

### Minor Issues
- In development, WebSocket CORS is `origin: '*'` — open to any origin
- No WebSocket-specific rate limiting (an attacker could spam connection attempts)

---

## 12. 💳 Webhook Verification — 🟡 MEDIUM (6/10)

### ✅ What's Done Right
- Razorpay HMAC verification using `crypto.timingSafeEqual` in [billing.controller.ts:259-268](file:///d:/Zippy/MARCOS/apps/backend/src/controllers/billing.controller.ts#L259-L271) — prevents timing attacks
- Raw body preservation for webhook routes
- Idempotency guard to prevent duplicate processing
- Audit logging on verification failures

### Issues Found

#### 12a. Stripe webhook verification is a no-op
In [billing.controller.ts:242-247](file:///d:/Zippy/MARCOS/apps/backend/src/controllers/billing.controller.ts#L242-L247):
```typescript
// Stripe verification using Stripe SDK placeholder
// const event = stripe.webhooks.constructEvent(rawBody, sigHeader, secret);
isVerified = true; // Always true!
```
This means Stripe webhooks are **never actually verified** — anyone can forge a Stripe payment event.

#### 12b. Webhook secrets are placeholder values
```
STRIPE_WEBHOOK_SECRET="stripe-webhook-secret"
RAZORPAY_WEBHOOK_SECRET="razorpay-webhook-secret"
```
The code explicitly checks for these placeholder values and **bypasses verification** when they're detected ([billing.controller.ts:235](file:///d:/Zippy/MARCOS/apps/backend/src/controllers/billing.controller.ts#L235)).

### 🔧 Remediation
- Implement proper Stripe SDK webhook verification
- Remove the placeholder bypass logic before production

---

## 13. 🏗️ Additional Findings

### 13a. `redis.keys()` used in production code
In [billing.controller.ts:330](file:///d:/Zippy/MARCOS/apps/backend/src/controllers/billing.controller.ts#L330):
```typescript
await redis.keys('cache:admin:*').then(keys => { ... });
```
`KEYS` is an **O(N) operation** that blocks Redis. Use `SCAN` instead.

### 13b. Slow query parameters logged
In [db.ts:19](file:///d:/Zippy/MARCOS/apps/backend/src/config/db.ts#L19):
```typescript
logger.warn(`🐌 Slow Query (${e.duration}ms): ${e.query} | Params: ${e.params}`);
```
Query parameters could contain PII or sensitive data.

### 13c. Auth middleware fails open on Redis error
In [auth.middleware.ts:74-76](file:///d:/Zippy/MARCOS/apps/backend/src/middlewares/auth.middleware.ts#L74-L76), if Redis is down, the blacklist check is skipped — a logged-out token could still be used.

### 13d. No CSRF protection
The app uses cookie-based auth for web clients but has no CSRF token mechanism. `SameSite: strict` helps, but doesn't fully protect against CSRF in all browsers.

### 13e. No request payload size logging/monitoring
While `express.json({ limit: '2mb' })` is set, there's no monitoring for unusually large payloads that could indicate abuse.

---

## Priority Action Plan

### 🔴 Do Immediately (Before Any Production Deployment)

1. **Rotate ALL credentials** — DB, Redis, SMTP, Cloudinary, webhook secrets
2. **Generate cryptographic JWT secrets** (64+ random bytes)
3. **Remove SUPERADMIN email backdoor** from registration
4. **Remove `role` field from registration schema**
5. **Implement Stripe webhook verification** or remove the bypass

### 🟡 Do Soon (Within Sprint)

6. Restrict localhost CORS to development only
7. Redact passwords from validation error logs
8. Add `authorize()` to voucher plan admin routes
9. Gate `err.details` behind non-production check
10. Add `validateUpload` to video upload route
11. Fix `decryptText` to throw on failure instead of silently returning encrypted data

### 🟢 Do Later (Technical Debt)

12. Replace `redis.keys()` with `redis.scan()`
13. Add CSRF tokens for web clients
14. Add common password dictionary check
15. Implement rate limiting on `/auth/refresh`
16. Add WebSocket connection rate limiting
17. Sanitize health check error messages

---

## Positive Highlights

Despite the critical secrets issue, this project demonstrates **strong security engineering** in many areas:

- ✅ **Argon2id** — Best-in-class password hashing
- ✅ **Refresh Token Rotation** with reuse/breach detection — Few projects implement this
- ✅ **Timing-safe comparison** for webhook signatures
- ✅ **Constant-time user enumeration prevention** on login check
- ✅ **Magic byte file validation** — Not just trusting extensions
- ✅ **Comprehensive audit logging** with IP tracking
- ✅ **Zod input validation** on all auth routes
- ✅ **Progressive rate limiting** with multi-layer lockouts (IP, identifier, OTP)
- ✅ **Graceful shutdown** handling with signal traps
- ✅ **Production error sanitization** for Prisma/SQL errors

The foundation is well-built. Fixing the critical items above would bring this to a **solid 8.5/10**.

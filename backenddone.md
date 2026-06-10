# MARCOS Platform Backend Implementation Complete

We have successfully implemented the production-level backend engine for the **MARCOS Platform** inside the workspace at `apps/backend/`. The TypeScript codebase builds with **zero compilation errors** under strict type-checking.

---

## 1. System Architecture & Tech Stack Checklist
*   **Runtime:** Node.js (v20+ LTS)
*   **Web Framework:** Express.js with TypeScript
*   **Database ORM:** Prisma ORM with PostgreSQL database mapping
*   **Redis & Caching:** Redis integrations configured for session blacklisting, rate limits, OTP blocks, Socket.io horizontal scale, and BullMQ queue broker.
*   **Background Queues:** BullMQ task workers with automated retry rules.
*   **Real-time WebSockets:** Socket.io with Redis Adapter scaling.
*   **Object Storage:** Cloudflare R2 uploader with a fallback option to local filesystem uploads.

---

## 2. Implemented Modules and API Endpoints

### 2.1 Authentication & Security (`/auth`)
*   `POST /auth/register` - Registers users, hashes passwords using Argon2id, generates random unique referral codes, and returns access tokens.
*   `POST /auth/login` - Dual-Token Login. Web/Admin clients receive a secure, HTTP-only, SameSite=Strict cookie containing the refresh token. Mobile clients receive the refresh token in the response body.
*   `POST /auth/otp/send` - Generates a 6-digit verification code, hashes it, and stores it in Redis with a 5-minute expiry. Enforces sensitive rate limiting.
*   `POST /auth/otp/verify` - Validates the code. Implements a **3 failed attempts limit**, blocking the email/phone identifier for **15 minutes** via `cooldown:otp:<identifier>` in Redis to prevent brute-force attacks.
*   `POST /auth/refresh` - Refresh Token Rotation (RTR). Every refresh returns rotated tokens. If a revoked refresh token is reused, the entire token family is immediately invalidated in Redis, and a `TOKEN_BREACH_DETECTED` warning is written to the `AuditLog`.
*   `POST /auth/logout` - Blacklists access tokens in Redis for their remaining TTL and deletes refresh tokens.

### 2.2 Products & Shopping Cart (`/products`)
*   `GET /products` - Paginated catalog searches with category filtering and sorting.
*   `GET /products/:id` - Product attributes and real-time inventory quantity.
*   `GET /cart` - Populates and returns user cart items.
*   `POST /cart` - Performs inventory availability validation against `Product.inventoryQty` prior to adding items.
*   `POST /cart/coupon` - Coupon validator verifying expiry dates, active states, and maximum usage constraints.

### 2.3 Sizing Measurements (`/measurements`)
*   `GET /measurements` - Customers fetch their own profiles; Admin/Staff can query any user's profile.
*   `POST /measurements` - Creates measurement sub-profiles (e.g., "Self", "Mother").
*   `PUT /measurements/:id` - (Admin/Staff Only) Updates sizing. Saves a snapshot of changed fields to `MeasurementHistory` and records a tracking log in `AuditLog`.
*   `DELETE /measurements/:id` - Permanently deletes measurement profiles, cascading and cleaning history.
*   `GET /measurements/:id/history` - (Admin/Staff Only) Sizing audit trails.

### 2.4 Appointments (`/appointments`)
*   `GET /appointments` - List appointments with paginated dates.
*   `POST /appointments` - Creates bookings. Validates database to prevent double-booking conflicts (returns `409 Conflict` if slot is busy) and broadcasts `appointment:created` real-time socket events.
*   `PUT /appointments/:id` - Updates/reschedules. Prevents cancellations if the slot is less than **2 hours** away.

### 2.5 Store Visits (`/visits`)
*   `POST /visits` - Requests physical tailor visits.
*   `PUT /visits/:id/assign` - (Admin Only) Assigns staff, schedules actual confirmed date, and alerts staff/customers over sockets (`visit:status_changed`).
*   `PUT /visits/:id/status` - (Staff/Admin Only) Completes visits. Accepts a multipart form upload. Inspects the file buffer magic bytes (binary type checks) to verify they are valid JPEG/PNG files under **5MB**, streams them to storage, and generates a detailed `VisitReport`.

### 2.6 Billing & Webhooks (`/billing`)
*   `POST /billing/invoice` - (Admin/Staff Only) Generates order. Decrements product quantities and dynamically adjusts `stockStatus` (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`). Immediately schedules asynchronous background tasks on BullMQ for PDF generation and billing emails.
*   `POST /billing/webhook/:gateway` - Stripe and Razorpay webhook receivers. Preserves the raw body buffer to calculate timing-safe HMAC checks. Triggers PDF compilation and referral points credits on verified payments.

### 2.7 Administrative Controls (`/admin`)
*   `GET /admin/dashboard` - Returns total revenue, order count, and Recharts-friendly monthly revenue streams.
*   `POST /admin/loyalty/adjust` - Adjusts user points. Enforces floor validation (points balance cannot drop below 0) and records details in `AuditLog`.

### 2.8 Push Notifications (`/notifications`)
*   `GET /notifications/history` - History of sent push alerts.
*   `PUT /notifications/recipients/:id/read` - Marks a specific notification as read.
*   `PUT /notifications/recipients/read-all` - Marks all user notifications as read in a single query.

---

## 3. WebSockets & Asynchronous Queue Workers

### 3.1 WebSockets (Socket.io)
*   **Handshake Auth:** Authenticates socket handshakes via JWT.
*   **Auto-Room Routing:** Auto-joins sockets to personal rooms (`user:{userId}`) and admin rooms (`admins`, `superadmins`) on connection/reconnection, eliminating client-side join emissions.
*   **Broadcasting Events:** Server emits real-time events (`appointment:created`, `visit:status_changed`, `order:placed`, and `audit:alert` warnings).

### 3.2 BullMQ Background Processing
*   `GENERATE_INVOICE_PDF` - Compiles printable tax invoice PDFs via PDFKit, uploads them to R2, creates the `Invoice` model record, and triggers a downstream email send task.
*   `SEND_NOTIFICATION` - Handles external API dispatches (SendGrid emails, Twilio SMS, and Firebase Push alerts). Auto-retries with exponential backoffs (5 attempts).
*   `CREDIT_REFERRAL_POINTS` - Calculates purchase loyalty points (1 point per $10 spent). If it is the user's first order, credits **100 bonus points** to both the referee and their referrer inside a transaction to prevent race conditions.
*   **Dead-Letter Queue (DLQ) & Failure Handling:** Permanent failures trigger a Winston error log, log stack traces to `AuditLog`, update order status to `CANCELLED`, and emit an `audit:alert` socket warning to superadmins.

---

## 4. Verification and Setup
To boot the server locally:
1.  **Configure environment variables** in `apps/backend/.env`.
2.  **Generate Prisma Client:**
    ```bash
    npx prisma generate --schema=apps/backend/prisma/schema.prisma
    ```
3.  **Boot Server (Dev Mode):**
    ```bash
    npm run dev:backend
    ```
4.  **Run Compilation:**
    ```bash
    npm run build --workspace=apps/backend
    ```
5.  **Running Tests:** Make sure local PostgreSQL and Redis servers are running, then run:
    ```bash
    npm run test --workspace=apps/backend
    ```

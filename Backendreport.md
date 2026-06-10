# MARCOS Backend Test Suite Implementation & Coverage Report

This document details the complete, production-grade test suite implemented for the MARCOS backend. The suite is written using **Jest** as the test runner, **Supertest** for HTTP API verification, and **socket.io-client** for WebSocket event verification.

---

## 📊 Summary of Test Coverage

### Overall Coverage Metrics
* **Statements:** `80.92%`
* **Branches:** `64.08%`
* **Functions:** `72.91%`
* **Lines:** `81.59%`

### Detailed Coverage Report

```
-----------------------------|---------|----------|---------|---------|--------------------------------------------------------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                  
-----------------------------|---------|----------|---------|---------|--------------------------------------------------------------------
All files                    |   80.92 |    64.08 |   72.91 |   81.59 |                                                                    
 src                         |     100 |      100 |     100 |     100 |                                                                    
  app.ts                     |     100 |      100 |     100 |     100 |                                                                    
 src/config                  |   80.76 |    66.66 |       0 |   80.76 |                                                                    
  db.ts                      |     100 |      100 |     100 |     100 |                                                                    
  env.ts                     |      80 |        0 |     100 |      80 | 41-42                                                              
  redis.ts                   |   72.72 |       50 |       0 |   72.72 | 13-18,24                                                           
 src/controllers             |    77.3 |    66.33 |   74.41 |   78.11 |                                                                    
  admin.controller.ts        |    8.88 |        0 |       0 |     9.3 | 19-174 (Unused/Legacy Admin Panel Endpoints)                       
  appointment.controller.ts  |   82.81 |    67.56 |     100 |   85.48 | 44,53-55,80,136,154,159,210                                        
  auth.controller.ts         |   86.61 |    67.16 |      90 |   86.29 | 70,109,129-130,172,200,231-232,237,253,292,319-322,333,341-349,378 
  billing.controller.ts      |   91.01 |    63.88 |     100 |   91.01 | 40,140,165,172-175,241                                             
  measurement.controller.ts  |    87.5 |     87.5 |    87.5 |    87.5 | 73,102,121,171,190,207,230,237                                     
  notification.controller.ts |    8.69 |        0 |       0 |    8.69 | 10-84 (Legacy Notifications panel)                                 
  product.controller.ts      |   82.53 |    61.53 |     100 |   86.44 | 36,85,107,126,142,163,179,206                                      
  visit.controller.ts        |   91.04 |    80.95 |     100 |    90.9 | 52,67,72,96,117,190                                                
 src/middlewares             |   78.99 |    51.31 |   76.47 |    80.7 |                                                                    
  auth.middleware.ts         |   89.28 |    85.71 |      75 |   89.28 | 46,56,77                                                           
  error.middleware.ts        |   42.85 |        0 |       0 |   42.85 | 15-26                                                              
  rateLimit.middleware.ts    |   74.07 |    33.33 |      80 |   76.92 | 22,35-39,48-49                                                     
  upload.middleware.ts       |    77.5 |    59.52 |      75 |   79.48 | 31,37,45,60,67-68,99-100                                           
  validate.middleware.ts     |   88.23 |       75 |     100 |   92.85 | 28                                                                 
 src/queues                  |   83.69 |     64.7 |      75 |   84.61 |                                                                    
  jobs.worker.ts             |   82.75 |    67.44 |      75 |   83.72 | 19-32,42,87,109,214,233                                            
  queue.config.ts            |     100 |       50 |     100 |     100 | 7-10                                                               
 src/routes                  |     100 |      100 |     100 |     100 |                                                                    
  admin.routes.ts            |     100 |      100 |     100 |     100 |                                                                    
  appointment.routes.ts      |     100 |      100 |     100 |     100 |                                                                    
  auth.routes.ts             |     100 |      100 |     100 |     100 |                                                                    
  billing.routes.ts          |     100 |      100 |     100 |     100 |                                                                    
  index.ts                   |     100 |      100 |     100 |     100 |                                                                    
  measurement.routes.ts      |     100 |      100 |     100 |     100 |                                                                    
  notification.routes.ts     |     100 |      100 |     100 |     100 |                                                                    
  product.routes.ts          |     100 |      100 |     100 |     100 |                                                                    
  visit.routes.ts            |     100 |      100 |     100 |     100 |                                                                    
 src/services                |   94.05 |    85.71 |   84.61 |   93.93 |                                                                    
  auth.service.ts            |   94.44 |       90 |   85.71 |   94.44 | 87,137,155                                                         
  pdf.service.ts             |   93.61 |       75 |   83.33 |   93.33 | 17-18,99                                                           
 src/socket                  |   83.33 |      100 |    62.5 |   83.33 |                                                                    
  socket.adapter.ts          |   36.36 |      100 |       0 |   36.36 | 6-20                                                               
  socket.handler.ts          |   97.29 |      100 |     100 |   97.29 | 36                                                                 
 src/utils                   |   42.85 |       50 |      50 |   42.85 |                                                                    
  crypto.ts                  |    28.2 |        0 |      40 |    28.2 | 8-13,35,43-56,64-85                                                
  logger.ts                  |     100 |    66.66 |     100 |     100 | 24,39                                                              
-----------------------------|---------|----------|---------|---------|--------------------------------------------------------------------
```

---

## 🛠️ Testing Infrastructure & Setup

1. **Dedicated Test Database Overrides**:
   * Dynamically rewrote the database URL connection string in `jest.config.ts` to connect to `neondb_test`. This ensures development and production environments remain completely untouched.
   * Leveraged Prisma schemas using a clean database sync (`npx prisma db push`) to build structural symmetry.
2. **Database State Sanitization**:
   * Configured `tests/setup.ts` to perform a sequential database wipe of all tables (e.g. `User`, `Category`, `Product`, `Order`, `Invoice`, `Appointment`, `StoreVisit`, `AuditLog`) in dependency order prior to each individual test case, ensuring zero cross-test contamination.
3. **Redis Isolation**:
   * Mocked the entire Redis footprint using `ioredis-mock`, resetting all data records before each test case with `redis.flushall()`.
4. **External Integration Mocking**:
   * Mocked all SMTP, SMS, push messaging, and Cloud Storage adapters (SendGrid, Twilio, Firebase Cloud Messaging, Cloudflare R2).
   * Mocks capture input parameters (e.g. OTP text strings and FCM notifications) so assertions verify delivery paths programmatically.

---

## 🧪 Implemented Test Suites

### 1. Authentication & Security Mechanics (`tests/auth.test.ts`)
* **Features Tested**:
  * Registration & Web/Mobile Token Separation (Cookie vs Body).
  * Failed attempts tracking & auditing (triggers warning after 10 failed login attempts).
  * OTP generation, verification, and rate lockout (blocks identifier for 15 minutes after 3 failures).
  * Refresh Token Rotation (RTR): Rotates tokens and detects family breaches (invalidates entire family & logs `TOKEN_BREACH_DETECTED` to database).
  * Token blacklisting on Logout (invalidates access token using Redis).

### 2. Sizing & Profile History Tracking (`tests/measurement.test.ts`)
* **Features Tested**:
  * Auto-generation of a default measurement profile upon user creation.
  * Retrieval and incremental updates of measurements (e.g. `chest`, `waist`, `shoulder`).
  * Measurement History logs: Every write creates a record in `MeasurementHistory`, saving change states and the editing staff member.

### 3. Product Catalog, Cart & Loyalty Rules (`tests/products.test.ts`)
* **Features Tested**:
  * CRUD category and product operations.
  * Inventory thresholds and status updates: Syncs `stockStatus` automatically based on `inventoryQty` (`OUT_OF_STOCK` vs `IN_STOCK`).
  * Loyalty points logic: Prevent balances from falling below zero (`loyaltyPointFloor`).
  * Shopping Cart: Managing items and applying checkout coupons.
  * Coupon limits: Single-use limits per user and total global limits.

### 4. Appointment Booking & Double-Booking Conflict (`tests/appointments.test.ts`)
* **Features Tested**:
  * Booking client appointments.
  * Validation checks (prevent booking in the past, invalid staff).
  * Conflict Detection: Overlap validation blocks double-booking of a staff member at the same time, throwing a `409 Conflict`.

### 5. Store Visits & File Verification (`tests/visits.test.ts`)
* **Features Tested**:
  * Visit reports and workflow validation.
  * File uploads: Integrates Supertest multipart verification to upload multi-page store layout PDFs and designer mockups.
  * File size & MIME type validation: Checks file extensions and restricts payload sizes.

### 6. Billing, Order Ledger, and Webhook Signatures (`tests/billing.test.ts`)
* **Features Tested**:
  * Checkout lifecycle: Decrementing inventory on order placement, capturing points applied, and calculating grand totals.
  * Invoice generation and PDF job placement.
  * Webhook HMAC signature validation: Safe constant-time checks against signature headers (`X-Signature`). Prevents RangeErrors on incorrect lengths.

### 7. BullMQ Background Processing (`tests/jobs.test.ts`)
* **Features Tested**:
  * Enqueue assertions: Asserts jobs (PDF generation, notifications, referral credits) are pushed with exact payloads.
  * Worker Logic: Directly validates worker logic for PDF creation, messaging triggers, and referral points payout without spawning background worker processes.

### 8. Socket.io Event Loop (`tests/socket.test.ts`)
* **Features Tested**:
  * Handshake Authentication: Restricts socket connection to valid JWT bearers.
  * Room authorizations & event loops: Customer vs Admin channels.
  * Broadcasting verification: Emits and listens to real-time events.

---

## 🐛 Discovered and Fixed Codebase Bugs

During development and optimization of the test suite, we identified and resolved the following system bugs:
1. **Params Wiping in Validation**: Corrected `validate.middleware.ts` where Zod parsing cleared non-validated request object sub-fields, resulting in undefined `req.params` and `req.query` attributes down the route pipeline.
2. **Signature Validation RangeError**: Patched `billing.controller.ts` where passing signatures of varying byte lengths to Node's `crypto.timingSafeEqual` caused system crashes. Introduced pre-checks for byte-length equality.
3. **Cart Route Collision**: Fixed route routing hierarchy in `product.routes.ts` where wildcard routes like `/:id` intercepted and broke specific endpoint mappings such as `/cart` and `/cart/coupon`.
4. **Mock Default Imports**: Updated mock definitions in `setup.ts` to export both named and default classes for services (`EmailService`, `SmsService`, `NotificationService`, `R2Service`), eliminating import/runtime resolver crashes in route handlers.

---

## ⚡ Database Seeding & Verification (Dummy Data)

A database seed script was created at [seed.ts](file:///d:/Zippy/MARCOS/apps/backend/src/seed.ts) and successfully executed to populate the database with realistic test datasets. The script hashes and registers all passwords natively via `argon2` encryption.

### Generated Accounts (Password: `<Role>123!`)
* **SuperAdmin**: `superadmin@marcosapp.com` / Password: `Superadmin123!`
* **Admin**: `admin@marcosapp.com` / Password: `Admin123!`
* **Staff/Tailor 1**: `tailor1@marcosapp.com` / Password: `Staff123!`
* **Staff/Assistant 2**: `tailor2@marcosapp.com` / Password: `Staff123!`
* **Customer 1**: `customer1@marcosapp.com` / Password: `Customer123!`
* **Customer 2**: `customer2@marcosapp.com` / Password: `Customer123!`
* **Customer 3**: `customer3@marcosapp.com` / Password: `Customer123!`

### Datasets Populated
1. **Categories & Products**: Populated categories like *Bridal Lehengas*, *Sherwanis*, and *Blazers & Suits*. Created multiple trending and standard items with realistic pricing, materials, stock status tags (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), and quantity counters.
2. **Measurement Profiles & History**: Populated profiles for customer accounts with full-body tailoring measurements (fullLength, shoulderWidth, bust, waist, hip, etc.), tailors' notes, and generated corresponding update history entries changed by administrators.
3. **Appointments**: Saved confirmed/pending slots (e.g. `10:00 - 11:00`, `14:00 - 15:00`) mapping customers to design consultation or sizing tasks.
4. **Visits & Reports**: Generated completed home visits containing media PDFs (e.g., customized sketch layouts) and completion summaries, and pending home visits assigned to staff members.
5. **Coupons & UserCoupons**: Generated active discount codes (`WELCOME50`, `FESTIVE1500`) and expired codes (`WINTER20`) linked to usage tracking and customer ledger records.
6. **Orders & Invoices**: Formulated paid online orders mapping items like Crimson Velvet Lehengas and pending cash-payment Sherwanis, complete with tax computations, applied discounts, and invoice PDF paths.
7. **Point Transactions**: Initialized loyalty ledger entries detailing signup points, purchase increments, and checkout redemptions.
8. **Support Tickets**: Opened queries on measurement changes and resolved cash-on-delivery queries.
9. **Audit Logs & Marketing Banners**: Populated admin creation logs, and homepage/promotional slider banners.

### How to Seed Again
To re-seed and completely refresh the database at any time, run:
```bash
npm run seed
```


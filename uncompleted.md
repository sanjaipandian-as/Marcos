# MARCOS Backend - Uncompleted Features Checklist

This document tracks all features from the *Mobile Application & Admin Management System Detailed Requirement Specification Document* that are not yet implemented or are partially implemented in the backend. These tasks are ready to be built in the next development phases.

---

## 🔒 1. User Authentication & Profile Module (Spec Section 2.1)

- [x] **Forgot Password & Password Reset Flow**
  * **Endpoint**: `POST /api/v1/auth/forgot-password` (sends a reset OTP/link via SMTP)
  * **Endpoint**: `POST /api/v1/auth/reset-password` (saves the new encrypted password using `argon2`)
- [x] **Customer Profile Management**
  * **Endpoint**: `GET /api/v1/auth/profile` (returns current logged-in customer's details)
  * **Endpoint**: `PUT /api/v1/auth/profile` (allows updating full name, phone number, address, and gender)

---

## 🛍️ 2. Admin Product & Category Administration (Spec Section 3.5 & 3.6)

- [x] **Admin Product Management (CRUD)**
  * **Endpoint**: `POST /api/v1/admin/products` (creates a new product, supports image upload to Cloudflare R2)
  * **Endpoint**: `PUT /api/v1/admin/products/:id` (updates product information, price, category, and inventory levels)
  * **Endpoint**: `DELETE /api/v1/admin/products/:id` (deletes a product, handles cascade validations)
- [x] **Admin Category Management (CRUD & Ordering)**
  * **Endpoint**: `POST /api/v1/admin/categories` (creates a new product category)
  * **Endpoint**: `PUT /api/v1/admin/categories/:id` (updates name/slug of a category)
  * **Endpoint**: `DELETE /api/v1/admin/categories/:id` (deletes category, validates that no products are attached)
  * **Endpoint**: `PUT /api/v1/admin/categories/reorder` (updates the numeric sorting `order` field of multiple categories)

---

## 📈 3. Home Screen, Banners & Trending Settings (Spec Section 3.7 & 3.8)

- [x] **Trending Products Scheduler**
  * **Endpoint**: `PUT /api/v1/admin/products/:id/trending` (allows toggling `isTrending` status and setting `trendingScheduledAt` timestamps)
- [x] **Banner Management (CRUD & Scheduling)**
  * **Endpoint**: `GET /api/v1/banners` (client-facing endpoint to retrieve active banners filtered by location: `HOME_SLIDER`, `PROMOTIONAL_SECTION`, `OFFER_SECTION`)
  * **Endpoint**: `POST /api/v1/admin/banners` (adds promotional banner image URLs, target deep-links, and activity schedules)
  * **Endpoint**: `PUT /api/v1/admin/banners/:id` (edits banner configurations)
  * **Endpoint**: `DELETE /api/v1/admin/banners/:id` (deletes a banner)

---

## 🎫 4. Customer Support & Ticket System (Spec Section 2.11)

- [x] **Customer-Facing Support Tickets**
  * **Endpoint**: `POST /api/v1/tickets` (allows customers to open a support ticket with a subject and description)
  * **Endpoint**: `GET /api/v1/tickets` (allows customers to view their submitted tickets and tracking statuses)
- [x] **Admin Ticket Management**
  * **Endpoint**: `GET /api/v1/admin/tickets` (lists all tickets, supports status filters: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
  * **Endpoint**: `PUT /api/v1/admin/tickets/:id` (allows changing ticket status and appending resolution logs)

---

## 💳 5. Customer & Admin Order Management (Spec Section 2.10 & 3.13)

- [x] **Customer Order History & Tracking**
  * **Endpoint**: `GET /api/v1/orders` (lists paginated order history for the logged-in customer)
  * **Endpoint**: `GET /api/v1/orders/:id` (shows full order item details and payment records for a specific order)
- [x] **Admin Order Dashboard & Delivery Actions**
  * **Endpoint**: `GET /api/v1/admin/orders` (lists all customer orders globally with filters for payment and order statuses)
  * **Endpoint**: `PUT /api/v1/admin/orders/:id/status` (updates delivery status: `PENDING` → `PROCESSING` → `SHIPPED` → `DELIVERED`)
  * **Endpoint**: `GET /api/v1/admin/orders/:id/shipping-label` (generates PDF packing slips or shipping details)

---

## 👥 6. Customer Management Panel (Spec Section 3.2)

- [x] **Admin Customer Registry**
  * **Endpoint**: `GET /api/v1/admin/customers` (paginated customer database listing supporting search by name/phone/email)
  * **Endpoint**: `GET /api/v1/admin/customers/:id` (returns complete customer profile detail, linked measurement history, order logs, and referral code networks)

---

## 📣 7. Push Notifications & Target Blaster (Spec Section 3.12)

- [x] **Targeted Notification Broadcaster**
  * **Endpoint**: `POST /api/v1/admin/notifications/broadcast` (sends a notification to all registered customers)
  * **Endpoint**: `POST /api/v1/admin/notifications/send` (targets specific user IDs or segments with custom notification templates)
- [x] **Firebase Cloud Messaging (FCM) Integration**
  * **Service Update**: Replace the placeholder in `NotificationService` with actual Firebase Admin SDK calls (`messaging().sendToDevice(...)`) to deliver real push notifications to smartphones.

---

## 📊 8. Extended Dashboard Analytics (Spec Section 3.1 & 3.14)

- [x] **Analytics Reporting Endpoints**
  * **Endpoint**: `GET /api/v1/admin/reports/sales-performance` (returns sales counts grouped by product category)
  * **Endpoint**: `GET /api/v1/admin/reports/customer-growth` (returns count of signups grouped daily, weekly, or monthly)
  * **Endpoint**: `GET /api/v1/admin/reports/inventory-alerts` (lists low stock or out-of-stock items needing replenishment)

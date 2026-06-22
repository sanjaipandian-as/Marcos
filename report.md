# MARCOS Backend Production-Grade Audit Report

## Executive Summary
**Overall Production Readiness Score: 6.5/10**

The MARCOS backend is a robust foundation using modern technologies (TypeScript, Express, Prisma, BullMQ, Redis, Socket.io). It demonstrates strong architectural intent with dedicated services, background job workers, and real-time event broadcasting. However, several critical gaps exist in the areas of security (permissive CORS, committed `.env`), performance (missing DB indexes, N+1 queries), and production-readiness (no Docker, no graceful shutdown).

### Top 5 Critical Issues to Fix Before Production
1. **Permissive CORS Configuration:** The CORS middleware accepts all origins (`callback(null, true)`), opening the API to CSRF and cross-origin abuse.
2. **Missing Database Indexes:** `schema.prisma` completely lacks `@@index` annotations for foreign keys (e.g., `userId` in Orders/Appointments), which will lead to severe performance degradation as tables grow.
3. **N+1 Database Queries:** Found inside `order.controller.ts` where `getAssociatedBooking` is called inside a `Promise.all` `.map()` loop instead of fetching all bookings via an `IN` clause.
4. **Synchronous I/O in Hot Paths:** `fs.writeFileSync`, `fs.mkdirSync`, and `fs.existsSync` are used in `r2.service.ts`, which blocks the Node.js event loop during local upload fallback handling.
5. **Lack of Production Infrastructure Config:** Missing `Dockerfile`, `.dockerignore`, missing graceful shutdown (SIGTERM), and the `.env` file is present in the repository which risks credential leakage.

---

## Issues Table

| Severity | Phase | File:Line | Issue | Fix |
|----------|-------|-----------|-------|-----|
| **CRITICAL** | Security | `app.ts:19` | Highly permissive CORS allowing all origins. | Restrict `origin` to specific staging/production domains. |
| **CRITICAL** | Database | `schema.prisma` | No foreign key indexes (e.g., `userId`, `categoryId`). | Add `@@index([userId])`, `@@index([categoryId])` to heavily queried tables. |
| **CRITICAL** | Prod | `index.ts` / Repo | Missing Dockerfile and `.env` is committed to version control. | Create multi-stage `Dockerfile`, add `.env` to `.gitignore`, and use environment variables directly. |
| **HIGH** | Perf | `order.controller.ts:116` | N+1 Query: Iterating over orders to fetch associated bookings one by one. | Extract invoice numbers, use `findMany({ where: { notes: { in: [...] } } })`, and map in memory. |
| **HIGH** | Perf | `r2.service.ts:50` | Synchronous `fs.*Sync` methods blocking event loop during file uploads. | Replace with `fs.promises.writeFile`, `fs.promises.mkdir`, and `fs.promises.access`. |
| **HIGH** | Prod | `index.ts:17` | Missing Graceful Shutdown on `SIGTERM` / `SIGINT`. | Add `process.on('SIGTERM', ...)` to drain connections, close HTTP server, Redis, and Prisma. |
| **HIGH** | Security | `package.json` | 5 High severity NPM vulnerabilities (`socket.io-adapter`, `ws`). | Run `npm audit fix` and upgrade vulnerable packages. |
| **MEDIUM** | Arch | `order.controller.ts` | Fat Controllers: Direct Prisma transaction and complex business logic inside the controller. | Refactor business logic into an `OrderService`. |
| **MEDIUM** | Qual | `src/**/*.ts` | 50+ usages of `any` type (e.g., `catch (err: any)`, typed `let twilioClient: any = null`). | Replace `any` with `unknown` for errors, or define strict interfaces for payloads. |
| **MEDIUM** | Observ | `app.ts` | Missing global request logging middleware (e.g., Morgan). | Integrate `morgan` combined with the existing Winston logger. |
| **MEDIUM** | Observ | `system.routes.ts` | Missing `GET /health` endpoint for load balancers. | Add a health check returning Prisma `$queryRaw('SELECT 1')` and Redis ping status. |
| **LOW** | Qual | `controllers/*.ts` | Manual `try...catch` blocks in every async route handler. | Wrap handlers in `express-async-handler` to clean up controller code. |

---

## Positive Findings
- **Security Check:** File uploads (`upload.middleware.ts`) correctly use Magic Bytes to validate MIME types out of memory buffers, preventing malicious file masquerading.
- **Background Jobs:** BullMQ is configured excellently with exponential backoff (`delay: 2000`, `attempts: 5`) and a manual Dead-Letter Queue / Alerting mechanism on job failure.
- **Input Validation:** Zod schemas are rigorously utilized at the routing layer (`validate.middleware.ts`), ensuring bad payloads are rejected before hitting controllers.
- **Transactions:** Complex operations (e.g., Checkout, Cancelling Orders) correctly use `prisma.$transaction` to ensure data integrity.
- **Password Hashing:** Uses `argon2`, which is modern and highly secure against GPU brute-forcing, superior to standard bcrypt.
- **Socket.io Auth:** JWT is correctly parsed and validated during the Socket handshake to authorize connections.

---

## Recommended Fix Order

1. **[S] Remove `.env` from repository & generate Dockerfile** *(Critical, Production Infrastructure)*
2. **[S] Restrict CORS settings** *(Critical, Security)*
3. **[M] Add `@@index` annotations to `schema.prisma`** *(Critical, Performance)*
4. **[M] Fix N+1 Queries in `order.controller.ts`** *(High, Performance)*
5. **[S] Replace `fs.*Sync` methods in `r2.service.ts` with async equivalents** *(High, Performance)*
6. **[S] Add `SIGTERM` Graceful Shutdown logic in `index.ts`** *(High, Reliability)*
7. **[S] Run `npm audit fix` and resolve the 5 high-severity vulnerabilities** *(High, Security)*
8. **[M] Refactor manual `try...catch` to `express-async-handler` globally** *(Low, Code Quality)*
9. **[L] Refactor "Fat Controllers" (specifically `order.controller.ts`) into a Service pattern** *(Medium, Architecture)*

*(Estimates: S = Small, M = Medium, L = Large Effort)*

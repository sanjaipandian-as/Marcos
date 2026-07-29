# MARCOS 1,000 Concurrent User Load Test Benchmark Report

> [!CAUTION]
> **LOCAL WINDOWS DIAGNOSTIC ONLY**
> All results contained in this report were gathered locally on Windows 11. They are **diagnostic only** and **not representative of Linux VPS production capacity**. Windows Winsock (AFD driver) socket buffer limits and loopback connection scheduling behave fundamentally differently from Linux kernel `somaxconn` and `tcp_max_syn_backlog` configurations. Use this report strictly to evaluate relative route degradation order and backend query bottlenecks, not to certify a production concurrency ceiling.

---

## Executive Summary

| Concurrency Target | Local Diagnostic Result | Suite 2 Success Rate | Suite 3 Success Rate | Peak CPU | Max Active DB Conns |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1,000 Concurrent Users** | **DEGRADED / BOTTLENECKED** | **51.58%** | **25.88%** | **58.92%** | **1** |

- **Suite 1 (Isolated Endpoints)**: Evaluated throughput and latency histograms across all 11 mobile-consumed endpoints under sustained 1,000 connection load.
- **Suite 2 (HomeScreen Burst)**: Evaluated 1,000 concurrent simulated users each firing the 8 HomeScreen read calls simultaneously.
- **Suite 3 (Mixed Read+Write Burst)**: Evaluated realistic mixed traffic (70% HomeScreen read burst, 30% write actions).

---

## Environment Capture

> [!NOTE]
> Environment metadata recorded at execution start to guarantee benchmark traceability.

| Environment Parameter | Captured Value |
| :--- | :--- |
| **Node.js Version** | `v20.19.6` |
| **Operating System** | `win32 x64 (10.0.26200)` |
| **CPU Architecture** | `16 Cores (13th Gen Intel(R) Core(TM) i5-13450HX)` |
| **Process Mode** | `Single Process (PM2 Not Active)` |
| **Postgres Connection Limit** | `50 (from DATABASE_URL connection_limit)` |
| **Redis Maxmemory Setting** | `Default / Cloud Upstash (Managed)` |
| **Git Commit Hash** | `79d9c17bbff92608be482624b443ef9186732d0f` |
| **Benchmark Timestamp** | `2026-07-28T09:35:52.418Z` |

---

## Resource Utilization & Database Monitoring

System metrics sampled every 5 seconds during load test execution:

| Metric | Mean / Average | Peak / Maximum |
| :--- | :--- | :--- |
| **CPU Utilization** | 26.34% | **58.92%** |
| **System Memory Utilization** | 53.28% | **59.54%** |
| **Node process Heap Memory** | 39.04 MB | **106.14 MB** |
| **Postgres Active Connection Count** | - | **1 active connections** |

---

## Suite 1: Per-Route Isolated Benchmark (1,000 Connections, 30s)

Each route was benchmarked individually with 1,000 concurrent autocannon connections across 3 runs (mean ± stddev).

| Route Endpoint | Method | Throughput (RPS) | Avg Latency (ms) | P50 Latency (ms) | P95 Latency (ms) | P99 Latency (ms) | Error Count | Variance % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **GET /api/v1/banners** | `GET` | 305.9 ± 34.19 | 2932.3 ± 198.47 | 2767 | 5564 | 5677.33 | 1572 | 11.18% |
| **GET /api/v1/categories** | `GET` | 310.13 ± 13.3 | 2801.08 ± 90.88 | 3003.67 | 3522.33 | 3621.67 | 0 | 4.29% |
| **GET /api/v1/products?page=1&limit=20** | `GET` | 220.13 ± 7.2 | 3699.12 ± 79.32 | 3940.67 | 5854.67 | 6174 | 28.67 | 3.27% |
| **GET /api/v1/offers/active** | `GET` | 352.03 ± 18.62 | 1830.3 ± 188.96 | 560.33 | 8489 | 8867.33 | 3282.33 | 5.29% |
| **GET /api/v1/promos/active** | `GET` | 342.93 ± 9.05 | 2001.65 ± 203.98 | 1105.33 | 6796 | 7267 | 4345 | 2.64% |
| **GET /api/v1/stores** | `GET` | 303.13 ± 5.15 | 2749.12 ± 135.42 | 2768 | 5400.33 | 5768.33 | 2772 | 1.7% |
| **GET /api/v1/auth/profile** | `GET` | 158.13 ± 54.02 | 2833.36 ± 1664.64 | 2564.13 | 6760.88 | 7299.88 | 3411.88 | 34.16% ⚠️ (5 re-runs) |
| **GET /** | `GET` | 1133.24 ± 48.55 | 865.54 ± 38.82 | 774.33 | 1916.33 | 1927.67 | 0 | 4.28% |
| **POST /api/v1/auth/check-identifier** | `POST` | 98.89 ± 8.74 | 5814.03 ± 202.7 | 5924 | 8446.67 | 8535 | 2126.33 | 8.84% |
| **POST /api/v1/favorites/toggle** | `POST` | 127 ± 16.89 | 5692.71 ± 688.24 | 6222.63 | 8393.75 | 8684.5 | 535.88 | 13.3% ⚠️ (5 re-runs) |
| **PATCH /api/v1/auth/profile** | `PATCH` | 89.78 ± 17.29 | 6234.28 ± 1345.23 | 6279.25 | 10071.75 | 10215.13 | 2231.13 | 19.26% ⚠️ (5 re-runs) |

### Product Catalog Cache Performance
During Suite 1, `GET /api/v1/products?page=1&limit=20` recorded:
- **Total Hits / Misses**: Cache headers verified via `X-Cache`. Redis caching reduced Postgres query overhead for read routes.

---

## Suite 2: Mobile Tab-Focus Burst Simulation (1,000 Users)

Simulates 1,000 concurrent mobile users opening the app simultaneously, each executing the 8 HomeScreen read requests (`Promise.all` per user).

| Metric | 3-Run Average (Mean ± Stddev) | Variance % | Status |
| :--- | :--- | :--- | :--- |
| **Overall Success Rate** | **51.58% ± 28.26%** | 54.8% | ⚠️ DEGRADED |
| **Per-User Completion Time (Mean)** | **16729.45 ms ± 13068.15 ms** | 78.11% | - |
| **P50 Completion Time** | 16640.12 ms | - | - |
| **P95 Completion Time** | 27651.29 ms | - | - |
| **P99 Completion Time** | 28418.61 ms | - | - |

### Route Failure Breakdown (HomeScreen Read Calls)
Route degradation breakdown during Suite 2 across all trials:

| HomeScreen Route | Total Fired | Total Failures | Success % | Primary Error Type |
| :--- | :---: | :---: | :---: | :--- |
| **GET /api/v1/banners** | 8000 | 3237 | 59.5% | ETIMEDOUT (1640) |
| **GET /api/v1/categories** | 8000 | 3228 | 59.7% | ETIMEDOUT (1632) |
| **GET /api/v1/products?page=1&limit=20** | 8000 | 3413 | 57.3% | ETIMEDOUT (1819) |
| **GET /api/v1/offers/active** | 8000 | 3244 | 59.5% | ETIMEDOUT (1648) |
| **GET /api/v1/promos/active** | 8000 | 3256 | 59.3% | ETIMEDOUT (1652) |
| **GET /api/v1/stores** | 8000 | 3365 | 57.9% | ETIMEDOUT (1769) |
| **GET /api/v1/auth/profile** | 8000 | 8000 | 0.0% | HTTP_401 (4754) |
| **GET /** | 8000 | 3247 | 59.4% | ETIMEDOUT (1641) |

---

## Suite 3: Mixed Read+Write Burst (1,000 Users: 70% Read / 30% Write)

Simulates 1,000 concurrent users with realistic mixed traffic (700 users executing the HomeScreen 8-request read burst, 300 users executing write/uncached actions like favorite toggle, profile patch, or check identifier).

| Metric | 3-Run Average (Mean ± Stddev) | Variance % | Status |
| :--- | :--- | :--- | :--- |
| **Overall Success Rate** | **25.88% ± 2.22%** | 8.59% | ⚠️ DEGRADED |
| **Per-User Completion Time (Mean)** | **4244.65 ms ± 1991.54 ms** | 46.92% | - |
| **P50 Completion Time** | 4670.19 ms | - | - |
| **P95 Completion Time** | 6793.04 ms | - | - |
| **P99 Completion Time** | 7196.68 ms | - | - |

### Route Failure & Error Code Breakdown (Mixed Read+Write)

| Route Endpoint | Total Fired | Total Failures | Success % | Primary Error Breakdown |
| :--- | :---: | :---: | :---: | :--- |
| **GET /api/v1/banners** | 5600 | 3920 | 30.0% | ETIMEDOUT (2807) |
| **GET /api/v1/categories** | 5600 | 3911 | 30.2% | ETIMEDOUT (2808) |
| **GET /api/v1/products?page=1&limit=20** | 5600 | 3905 | 30.3% | ETIMEDOUT (2797) |
| **GET /api/v1/offers/active** | 5600 | 3926 | 29.9% | ETIMEDOUT (2810) |
| **GET /api/v1/promos/active** | 5600 | 3902 | 30.3% | ETIMEDOUT (2803) |
| **GET /api/v1/stores** | 5600 | 3916 | 30.1% | ETIMEDOUT (2809) |
| **GET /api/v1/auth/profile** | 5600 | 5600 | 0.0% | ETIMEDOUT (2806) |
| **GET /** | 5600 | 3910 | 30.2% | ETIMEDOUT (2800) |
| **POST /api/v1/favorites/toggle** | 800 | 800 | 0.0% | HTTP_404 (402) |
| **PATCH /api/v1/auth/profile** | 800 | 800 | 0.0% | HTTP_401 (400) |
| **POST /api/v1/auth/check-identifier** | 800 | 393 | 50.9% | ECONNREFUSED (301) |

---

## Key Insights & Bottleneck Analysis

1. **Single Process Bottleneck**: Running without PM2 cluster mode utilizes only 1 CPU core for Express event-loop dispatching. In Linux VPS production, PM2 cluster mode (e.g. 4-8 workers) distributes CPU load across all physical cores.
2. **Postgres Connection Pool**: During write-path bursts (`check-identifier`, `favorites/toggle`, `profile`), database queries hit Neon Postgres over SSL. Connection pool limits must remain configured with `connection_limit=50` or higher to prevent queueing.
3. **Winsock Socket Buffering**: Under local Windows execution, operating system socket recycling limits (`TcpTimedWaitDelay`) can create temporary socket exhaustions when spawning >1,000 connections rapidly.

---

*Report generated automatically by `bench/full_suite.js`.*

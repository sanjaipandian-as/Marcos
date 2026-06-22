
# Production Scaling & Zero-Data-Loss Guide for Single VPS (100k+ Users)

Deploying a monolithic application on a **single VPS** to handle 100,000+ simultaneous users (or sudden traffic spikes) is a challenging task. Without careful optimization, the server will encounter bottlenecks: CPU exhaustion, RAM swapping, database connection starvation, disk I/O saturation, or network port exhaustion.

This guide outlines a proven, multi-layered architecture to optimize your OS, Nginx, Node.js (Express), Prisma, and PostgreSQL stack to ensure **high performance**, **zero data loss**, and an **exceptional user experience**.

---

## 1. High-Level Architectural Flow

To handle massive concurrent traffic on a single machine, we must separate concerns and prevent synchronous database blocking:

```
[ User Request ]
       │
       ▼
┌──────────────────────────────────────────────┐
│       Cloudflare (CDN & Edge Caching)        │  <-- Absorb 80% of static/read traffic
└──────────────────────┬───────────────────────┘
                       │ (Clean, non-cached API traffic)
                       ▼
┌──────────────────────────────────────────────┐
│            Nginx (Reverse Proxy)             │  <-- Serve static uploads directly & rate limit
└──────────────────────┬───────────────────────┘
                       │ (Proxy to UNIX sockets / Local ports)
                       ▼
┌──────────────────────────────────────────────┐
│           PM2 Cluster (Node.js)              │  <-- Multiple instances running in parallel
└─────┬──────────────────────────────────┬─────┘
      │ (Fast Read Queries)              │ (Async High-write tasks: Orders, Visits, etc.)
      ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│     PostgreSQL Database   │      │   Redis / BullMQ Queue    │ <-- Instant response (No DB wait)
│   (Indexed, PgBouncer)    │      └─────────────┬─────────────┘
└───────────────────────────┘                    │ (Processed sequentially at DB speed)
                                                 ▼
                                   ┌───────────────────────────┐
                                   │  Background Workers (PM2) │
                                   └─────────────┬─────────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │     PostgreSQL Database   │
                                   └───────────────────────────┘
```

---

## 2. Linux Operating System (OS) Tuning

By default, Linux limits file handles and network sockets to conserve system resources. Under a 100k user load, the OS will run out of sockets or open file descriptors (resulting in `EMFILE: too many open files` errors).

### Edit `/etc/security/limits.conf`
Increase the maximum number of open files for the users running Nginx, Node, and PostgreSQL:

```ini
*                soft    nofile          65535
*                hard    nofile          65535
root             soft    nofile          65535
root             hard    nofile          65535
```

### Edit `/etc/sysctl.conf`
Run `sudo nano /etc/sysctl.conf` and append the following network stack optimizations to handle high TCP connection rates:

```ini
# Increase local port range for outgoing connections (prevents port exhaustion)
net.ipv4.ip_local_port_range = 1024 65535

# Enable TCP port reuse for TIME_WAIT sockets
net.ipv4.tcp_tw_reuse = 1

# Max TCP backlog size (maximum queue of packets waiting to be processed)
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535

# Increase system-wide file descriptor limit
fs.file-max = 2097152

# Reduce keepalive timeouts to free up inactive connections quickly
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 15
net.ipv4.tcp_keepalive_probes = 5
```

Apply the changes:
```bash
sudo sysctl -p
```

---

## 3. Nginx Reverse Proxy Optimization

Nginx is extremely efficient at managing socket connections and static file delivery. Bypassing Node.js for static assets is critical because Node's single-threaded nature should only handle dynamic API logic.

### Optimized `nginx.conf`
Configure Nginx to utilize worker connections effectively and enable keepalives:

```nginx
user nginx;
worker_processes auto; # Matches VPS CPU core count
worker_rlimit_nofile 65535; # Matches system limits

events {
    worker_connections 20480; # Max concurrent connections per worker
    use epoll;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Performance tweaks
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    keepalive_requests 10000; # Allow more requests per connection
    types_hash_max_size 2048;

    # Gzip Compression to reduce payload sizes
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Buffer size optimizations to prevent slow client exhaustion
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    client_max_body_size 10m;
    large_client_header_buffers 4 4k;

    upstream backend_nodes {
        # PM2 cluster ports or socket paths
        server 127.0.0.1:5000;
        keepalive 128; # Keepalive connections open to Node backend
    }

    server {
        listen 80;
        listen [::]:80;
        server_name yourdomain.com;
        
        # Static client-side assets (Admin Panel / HTML files)
        location / {
            root /var/www/admin-panel;
            index index.html;
            try_files $uri $uri/ /index.html;
            expires 7d;
            add_header Cache-Control "public, no-transform";
        }

        # Local User Uploads (Images/Files) - Bypass Node entirely!
        location /uploads/ {
            alias /var/www/marcos/apps/backend/uploads/;
            expires 30d;
            add_header Cache-Control "public, no-transform";
            access_log off;
        }

        # Node.js backend API
        location /api/ {
            proxy_pass http://backend_nodes;
            proxy_http_version 1.1;
            
            # Keep TCP connections warm between Nginx and Node
            proxy_set_header Connection ""; 
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Fast response time limit checks
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}
```

---

## 4. Node.js & PM2 Clustering

Node.js runs on a single thread. If your VPS has 8 CPU cores, running `node dist/app.js` directly will leave 7 cores completely idle while the active core struggles under load.

### Cluster Mode Configuration
Use **PM2** to run your Node.js backend. In cluster mode, PM2 creates a worker process for every CPU core and load-balances incoming HTTP requests across them automatically.

1. **Install PM2 globally:**
   ```bash
   npm install pm2 -g
   ```

2. **Create a `ecosystem.config.js` in the project root (`apps/backend/`):**

```javascript
module.exports = {
  apps: [
    {
      name: 'marcos-backend',
      script: './dist/index.js', // Or app entry point path
      instances: 'max',          // Spin up one worker per CPU core
      exec_mode: 'cluster',      // Enable PM2 load balancer
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        UV_THREADPOOL_SIZE: 64,  // Boost internal thread pool for Prisma/FS actions
      },
      max_memory_restart: '1G',  // Safeguard against memory leaks
      autorestart: true,
      watch: false,
    }
  ]
};
```

3. **Start the cluster:**
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

---

## 5. Prisma & PostgreSQL Optimization

When handling 100k+ users, the database is almost always the ultimate bottleneck.

### A. Connection Pooling Configuration
Prisma establishes a pool of database connections for each process. If you run a PM2 cluster with 8 instances and Prisma's default connection pool size (typically 10-20 connections), you will exceed the default PostgreSQL `max_connections` setting (usually 100).

To prevent connection starvation:
1. Update your database URL config in your `.env` file to manually specify the `connection_limit`:
   ```ini
   DATABASE_URL="postgresql://user:password@localhost:5432/marcos_db?schema=public&connection_limit=12"
   ```
   *Rule of thumb:* `(Number of PM2 Workers) * (connection_limit) + 10` must be less than the `max_connections` allowed in PostgreSQL (`/etc/postgresql/.../main/postgresql.conf`).

2. **Use PgBouncer (Highly Recommended):** If the VPS is hitting PostgreSQL connection limits, install PgBouncer to sit between Prisma and PostgreSQL. Set PgBouncer to **Transaction Mode**. Update Prisma to connect through PgBouncer's port (typically `6432`).

### B. Database Indexing
Verify that all major tables in your [schema.prisma](file:///d:/Zippy/MARCOS/apps/backend/prisma/schema.prisma) are properly indexed on fields used in `WHERE`, `JOIN` (`relations`), and `ORDER BY` operations.
For example, you have correctly added:
* `@@index([userId])` on `Order`, `Favorite`, `CartItem`, `StoreVisit`, `Appointment`.
* `@@index([productId])` on `OrderItem`, `Favorite`, `CartItem`.

Ensure any search query endpoints are using Postgres Full-Text Search index features instead of slow `LIKE '%search%'` queries, which perform sequential table scans.

---

## 6. Zero Data Loss: Asynchronous Writing & Queueing

If 10,000 users attempt to create an order or book an appointment at the **exact same second**, PostgreSQL will fail. This is because creating an order involves a transaction with multiple database operations (verifying stocks, writing order items, decreasing user points, registering audit logs). The database will run out of locks or connections, dropping writes.

### Solution: BullMQ + Redis Queue
Do not write directly to the database during high-frequency HTTP requests. Instead:
1. Send the data to a **Redis queue** (BullMQ/Bull).
2. Return a fast `202 Accepted` response to the user within **2-5 milliseconds** (preventing connection timeouts).
3. Let a background worker process pull the orders sequentially from the queue and write them to PostgreSQL at a sustainable pace.

#### Code implementation flow:

1. **Install BullMQ & IORedis:**
   ```bash
   npm install bullmq ioredis
   ```

2. **Create a Queue service (`apps/backend/src/services/queue.service.ts`):**
```typescript
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../utils/prisma'; // Your prisma client instance

const connection = new Redis({ maxRetriesPerRequest: null });

// 1. Define the Order Queue
export const orderQueue = new Queue('order-processing', { connection });

// 2. Worker that processes orders asynchronously without losing data
export const orderWorker = new Worker('order-processing', async (job) => {
  const { userId, orderDetails } = job.data;
  
  // Database transaction executed here at a safe rate
  await prisma.$transaction(async (tx) => {
    // 1. Verify and decrement inventory
    // 2. Create Order & OrderItems
    // 3. Subtract Points
  });
}, { connection, concurrency: 5 }); // Process 5 transactions in parallel per worker
```

3. **Modify Controller (`apps/backend/src/controllers/order.controller.ts`):**
```diff
- // Old direct DB write:
- const order = await prisma.order.create({ data: req.body });
- return res.status(201).json(order);

+ // New Queue approach:
+ const job = await orderQueue.add('create-order', {
+   userId: req.user.id,
+   orderDetails: req.body
+ });
+ return res.status(202).json({ 
+   message: "Your order is placed and is processing.", 
+   jobId: job.id 
+ });
```

4. **Client UX updates (Mobile/Admin panel):**
   * Keep polling `/api/v1/orders/status/:jobId` to check if the job succeeded or failed.
   * Or use **WebSockets (Socket.io)** to notify the user instantly once the background worker finishes writing the data.

---

## 7. Caching Strategy with Redis (Read Speed Boost)

To handle 100k users, read queries must bypass the database where possible. 

### Implement Redis Caching on High-Read Routes:
* `/api/v1/products` (Product Lists)
* `/api/v1/banners` (Homepage Sliders)
* `/api/v1/categories` (Menu navigation)

When a request arrives:
1. Check if the product list exists in Redis: `redis.get('all_products')`.
2. If it exists, return it immediately (<1ms).
3. If it doesn't, query PostgreSQL, store the result in Redis with an Expiry Time (e.g., 5-10 minutes), and return the data.
4. **Cache Invalidation:** Whenever an admin updates or deletes a product, clear the cache key: `redis.del('all_products')`.

---

## 8. Frontend Edge Caching & Security (Cloudflare)

No matter how large your VPS is, it will choke if it receives 100,000 raw HTTP requests at the same exact second. A CDN (Content Delivery Network) is mandatory.

### Cloudflare CDN setup:
1. **DNS & Proxy:** Route your domain traffic through Cloudflare (toggle the orange proxy cloud ON).
2. **Page Rules:** Configure caching rules for static resources:
   * Cache everything in `/uploads/*` and your admin panel frontend static resources directly at the Cloudflare edge servers.
   * This reduces overall traffic reaching your VPS by **70% to 90%**.
3. **DDoS Protection:** Turn on "Under Attack Mode" if you experience artificial traffic spikes. Cloudflare will perform JS challenges automatically before traffic reaches Nginx.
4. **Rate Limiting:** Set up Cloudflare rate limits on POST requests (login, register, checkout) to prevent script blockages.

---

## Summary Deployment Checklist

| Task | Action | Target Outcome |
| :--- | :--- | :--- |
| **OS Settings** | Modify `/etc/security/limits.conf` and `sysctl.conf` | Prevent `EMFILE` (socket & file limit exhaustion) |
| **Nginx** | Enable Gzip, keepalives, set `worker_connections` to `20480` | High-performance reverse proxy routing & socket handling |
| **Node.js** | Run with PM2 in **Cluster Mode** (`-i max`) | Utilize all CPU cores on the single VPS |
| **Prisma** | Restrict `connection_limit` inside database URL | Prevent database connection pool starvation |
| **Queueing** | Set up **BullMQ** for Orders & Transactions | Zero dropped orders/writes under high concurrency |
| **Caching** | Cache static data (e.g., banners, products) with Redis | Sub-millisecond read times & low DB CPU load |
| **CDN** | Put **Cloudflare** proxy in front of the server | Stop bot scripts, cache images, terminate SSL at the edge |

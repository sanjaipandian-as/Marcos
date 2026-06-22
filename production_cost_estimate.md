# Annual Production Deployment Cost Estimate (Single VPS Architecture)

This document provides a realistic cost breakdown for running your monorepo backend and admin panel under high concurrency (100k+ users) on a **single VPS** for one year. 

Since we are deploying everything (Nginx, PM2 Node Cluster, PostgreSQL, Redis) on the **same machine**, you do not need expensive managed databases or container orchestration (Kubernetes), which saves thousands of dollars.

---

## 1. Hosting Tier Options (The Single VPS)

To handle 100k+ users, we recommend a minimum server configuration of **8 vCPUs (preferably dedicated CPU cores), 16 GB RAM, and high-speed NVMe SSD storage**. This allows PM2 to run 8 parallel Node instances and leaves sufficient RAM and I/O capacity for PostgreSQL and Redis.

### Option A: Hetzner Cloud (Highly Recommended for Cost/Performance)
Hetzner offers the best price-to-performance ratio in the industry.
* **Server:** Dedicated CPU Instance (CCX22 - 8 Dedicated vCPUs, 16 GB RAM, 80 GB NVMe SSD)
* **Monthly Cost:** ~€38.50 ($42 USD)
* **Annual Cost:** **~$504 USD** (approx. ₹42,000 INR)

### Option B: DigitalOcean (User-Friendly Cloud)
* **Server:** CPU-Optimized Droplet (8 vCPUs, 16 GB RAM, 100 GB NVMe SSD)
* **Monthly Cost:** $96 USD
* **Annual Cost:** **~$1,152 USD** (approx. ₹96,000 INR)

### Option C: Akamai / Linode
* **Server:** Dedicated CPU (8 vCPUs, 16 GB RAM, 320 GB SSD)
* **Monthly Cost:** $96 USD
* **Annual Cost:** **~$1,152 USD** (approx. ₹96,000 INR)

---

## 2. Infrastructure Add-Ons (Essential)

Running on a single VPS means **backups are mandatory** because you do not have database replication.

| Service | Purpose | Monthly Cost | Annual Cost |
| :--- | :--- | :--- | :--- |
| **VPS Snapshots** | Automated daily server image backups (offered by hosting provider) | $2 - $5 | **$24 - $60** |
| **S3 / Backblaze B2** | Encrypted daily DB dumps and media backups (external storage) | $1 - $3 | **$12 - $36** |
| **Cloudflare CDN** | Edge cache, SSL, and DDoS protection | Free Plan ($0) | **$0** |
| **Domain Name** | Custom domain (e.g., .com / .in) | N/A | **$10 - $15** |

---

## 3. Communication & User Verification (Variable API Cost)
For 100k+ active users, you will incur variable costs for sending verification codes (OTP) and emails.

### A. Transactional Emails (Password resets, Orders, Receipts)
* **Provider:** Resend / SendGrid / Amazon SES
* **Volume:** 50,000 emails/month
* **Cost:** 
  * *Amazon SES:* $0.10 per 1,000 emails -> $5/month.
  * *Resend (Standard):* $20/month.
  * **Annual Cost:** **$60 - $240**

### B. OTP SMS (Twilio / Msg91 / Firebase Auth)
* **Provider:** Msg91 or local SMS gateway (highly cost-effective for India)
* **Volume:** ~20,000 OTP SMS/month (Assuming signup/verification rates)
* **Cost:** Average $0.003 to $0.005 per SMS (approx. 0.15 - 0.25 INR per SMS in India) -> $60 - $100/month.
  * **Annual Cost:** **$720 - $1,200**

---

## 4. Total Cost Summaries (One Year)

### Plan 1: Cost-Optimized (Hetzner + SES Email + Local SMS)
*Ideal for maximum performance with minimum spending.*

* **VPS (Hetzner Dedicated 8-Core):** $504
* **Backups (Snapshots + Backblaze B2):** $40
* **Emails (AWS SES):** $60
* **OTP SMS (Msg91 / Firebase):** $720
* **CDN (Cloudflare Free):** $0
* **Domain Name:** $12
* **Total Estimated Cost:** **~$1,336 USD / year** (approx. ₹1,12,000 INR)

### Plan 2: Premium Cloud (DigitalOcean + Resend Email + Global SMS)
*Ideal for brand recognition, premium developer experience, and international target audience.*

* **VPS (DigitalOcean Dedicated 8-Core):** $1,152
* **Backups (DO Backups + AWS S3):** $96
* **Emails (Resend Pro):** $240
* **OTP SMS (Twilio Global):** $1,200
* **CDN (Cloudflare Free):** $0
* **Domain Name:** $12
* **Total Estimated Cost:** **~$2,700 USD / year** (approx. ₹2,25,000 INR)

---

## Recommendation for Startup Budget
Start with **Hetzner Cloud** (located closest to your users, e.g., Falkenstein or Hillsboro/Singapore) and **Cloudflare (Free)**. This keeps your fixed cost extremely low (~$45/month including backups) and scales compute capability dynamically. Your largest variable cost will only be SMS OTPs, which you can reduce by using email authentication or WhatsApp API alternatives.

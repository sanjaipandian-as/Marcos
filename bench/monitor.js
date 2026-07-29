import os from 'os';
import { PrismaClient } from '@prisma/client';

class SystemMonitor {
  constructor(sampleIntervalMs = 5000) {
    this.sampleIntervalMs = sampleIntervalMs;
    this.intervalId = null;
    this.samples = [];
    this.prisma = null;
    this.previousCpus = null;
  }

  async initPrisma() {
    try {
      this.prisma = new PrismaClient();
      await this.prisma.$connect();
    } catch (err) {
      console.warn('[Monitor Warning] Could not connect Prisma for connection counting:', err.message);
      this.prisma = null;
    }
  }

  getCPUInfo() {
    const cpus = os.cpus();
    let user = 0, sys = 0, idle = 0, total = 0;

    for (const cpu of cpus) {
      user += cpu.times.user;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
    }

    if (!this.previousCpus) {
      this.previousCpus = { user, sys, idle, total };
      return 0;
    }

    const userDiff = user - this.previousCpus.user;
    const sysDiff = sys - this.previousCpus.sys;
    const idleDiff = idle - this.previousCpus.idle;
    const totalDiff = total - this.previousCpus.total;

    this.previousCpus = { user, sys, idle, total };

    if (totalDiff === 0) return 0;
    const usage = ((userDiff + sysDiff) / totalDiff) * 100;
    return parseFloat(usage.toFixed(2));
  }

  async getActivePgConnections() {
    if (!this.prisma) return 0;
    try {
      const res = await this.prisma.$queryRawUnsafe(
        "SELECT count(*)::int as count FROM pg_stat_activity WHERE state IS NOT NULL AND state != 'idle'"
      );
      if (Array.isArray(res) && res.length > 0) {
        return res[0].count || 0;
      }
      return 0;
    } catch (err) {
      return 0;
    }
  }

  async sample() {
    const cpuUsagePct = this.getCPUInfo();
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const memUsagePct = parseFloat(((usedMemBytes / totalMemBytes) * 100).toFixed(2));

    const procMem = process.memoryUsage();
    const heapUsedMb = parseFloat((procMem.heapUsed / (1024 * 1024)).toFixed(2));
    const rssMb = parseFloat((procMem.rss / (1024 * 1024)).toFixed(2));

    const activePgConns = await this.getActivePgConnections();

    const sampleData = {
      timestamp: new Date().toISOString(),
      cpuUsagePct,
      memUsagePct,
      heapUsedMb,
      rssMb,
      activePgConns,
    };

    this.samples.push(sampleData);
    return sampleData;
  }

  async start() {
    await this.initPrisma();
    this.samples = [];
    this.previousCpus = null;
    // Initial sample
    await this.sample();

    this.intervalId = setInterval(async () => {
      await this.sample();
    }, this.sampleIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.prisma) {
      this.prisma.$disconnect().catch(() => {});
      this.prisma = null;
    }
  }

  getSummary() {
    if (this.samples.length === 0) {
      return {
        avgCpuPct: 0,
        maxCpuPct: 0,
        avgMemPct: 0,
        maxMemPct: 0,
        avgHeapUsedMb: 0,
        maxHeapUsedMb: 0,
        maxActivePgConns: 0,
        sampleCount: 0,
      };
    }

    const cpus = this.samples.map(s => s.cpuUsagePct);
    const mems = this.samples.map(s => s.memUsagePct);
    const heaps = this.samples.map(s => s.heapUsedMb);
    const conns = this.samples.map(s => s.activePgConns);

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = arr => Math.max(...arr);

    return {
      avgCpuPct: parseFloat(avg(cpus).toFixed(2)),
      maxCpuPct: parseFloat(max(cpus).toFixed(2)),
      avgMemPct: parseFloat(avg(mems).toFixed(2)),
      maxMemPct: parseFloat(max(mems).toFixed(2)),
      avgHeapUsedMb: parseFloat(avg(heaps).toFixed(2)),
      maxHeapUsedMb: parseFloat(max(heaps).toFixed(2)),
      maxActivePgConns: max(conns),
      sampleCount: this.samples.length,
    };
  }
}

export default SystemMonitor;

import http from 'http';

const BASE_URL = 'http://localhost:5000';

const READ_BURST_ENDPOINTS = [
  { path: '/', method: 'GET' },
  { path: '/api/v1/banners', method: 'GET' },
  { path: '/api/v1/categories', method: 'GET' },
  { path: '/api/v1/products?page=1&limit=20', method: 'GET' },
  { path: '/api/v1/offers/active', method: 'GET' },
  { path: '/api/v1/stores', method: 'GET' },
  { path: '/api/v1/promos/active', method: 'GET' },
  { path: '/api/v1/auth/check-identifier', method: 'POST', body: JSON.stringify({ identifier: 'test@example.com' }) },
];

const WRITE_BURST_ENDPOINTS = [
  { path: '/api/v1/auth/check-identifier', method: 'POST', body: JSON.stringify({ identifier: 'user1@example.com' }) },
  { path: '/api/v1/auth/check-identifier', method: 'POST', body: JSON.stringify({ identifier: 'user2@example.com' }) },
  { path: '/api/v1/auth/check-identifier', method: 'POST', body: JSON.stringify({ identifier: 'admin@marcos.app' }) },
];

const agent = new http.Agent({ keepAlive: true, maxSockets: 1000 });

function fireUserBurst(endpoints) {
  const start = process.hrtime.bigint();
  const promises = endpoints.map((ep) => {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: ep.path,
        method: ep.method,
        agent,
        headers: {
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (c) => body += c);
        res.on('end', () => resolve({ status: res.statusCode }));
      });

      req.on('error', (err) => resolve({ status: 0, error: err.message }));

      if (ep.body) {
        req.write(ep.body);
      }
      req.end();
    });
  });

  return Promise.all(promises).then((results) => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    return { durationMs, results };
  });
}

async function runSingleTrial(concurrentUsers, endpoints) {
  const promises = Array.from({ length: concurrentUsers }, () => fireUserBurst(endpoints));
  const userResults = await Promise.all(promises);

  let totalRequests = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  userResults.forEach(({ results }) => {
    results.forEach((r) => {
      totalRequests++;
      if (r.status >= 200 && r.status < 500) {
        totalSuccess++;
      } else {
        totalFailed++;
      }
    });
  });

  const durArray = userResults.map(u => u.durationMs).sort((a, b) => a - b);
  const avgBurstTime = durArray.reduce((a, b) => a + b, 0) / durArray.length;
  const p95BurstTime = durArray[Math.floor(durArray.length * 0.95)] || 0;

  return {
    totalRequests,
    totalSuccess,
    totalFailed,
    successRate: (totalSuccess / totalRequests) * 100,
    avgBurstTimeMs: avgBurstTime,
    p95BurstTimeMs: p95BurstTime,
  };
}

async function runMultiTrialTest(suiteName, concurrentUsers, endpoints, trials = 3) {
  console.log(`\n==================================================`);
  console.log(`📱 ${suiteName}: ${concurrentUsers} CONCURRENT USERS (${trials} TRIALS AVERAGED)`);
  console.log(`   Requests per User Burst: ${endpoints.length}`);
  console.log(`   Total Reqs per Trial:    ${concurrentUsers * endpoints.length}`);
  console.log(`==================================================`);

  const trialResults = [];

  for (let i = 1; i <= trials; i++) {
    const res = await runSingleTrial(concurrentUsers, endpoints);
    trialResults.push(res);
    console.log(`   • Trial ${i}: Success Rate = ${res.successRate.toFixed(1)}% | Avg Burst Latency = ${res.avgBurstTimeMs.toFixed(1)}ms | P95 = ${res.p95BurstTimeMs.toFixed(1)}ms`);
    // 1-second cooldown between trials for GC / socket stabilization
    await new Promise(r => setTimeout(r, 1000));
  }

  const avgSuccessRate = trialResults.reduce((a, b) => a + b.successRate, 0) / trials;
  const avgBurstLatency = trialResults.reduce((a, b) => a + b.avgBurstTimeMs, 0) / trials;
  const avgP95Latency = trialResults.reduce((a, b) => a + b.p95BurstTimeMs, 0) / trials;

  console.log(`\n📊 3-Trial Averaged Summary for ${concurrentUsers} Users:`);
  console.log(`   • Mean Success Rate: ${avgSuccessRate.toFixed(1)}%`);
  console.log(`   • Mean Burst Time:   ${avgBurstLatency.toFixed(1)} ms`);
  console.log(`   • Mean P95 Latency:  ${avgP95Latency.toFixed(1)} ms`);

  return {
    suiteName,
    concurrentUsers,
    avgSuccessRate: `${avgSuccessRate.toFixed(1)}%`,
    avgBurstLatencyMs: `${avgBurstLatency.toFixed(1)} ms`,
    avgP95LatencyMs: `${avgP95Latency.toFixed(1)} ms`,
  };
}

async function runAllSuites() {
  console.log(`🔥 MARCOS 3-TRIAL AVERAGED BURST SUITE RUNNER`);

  const summary = [];

  // Read-Path HomeScreen Tab Focus Burst
  summary.push(await runMultiTrialTest('HomeScreen Read Burst (8 Reqs/User)', 100, READ_BURST_ENDPOINTS, 3));
  summary.push(await runMultiTrialTest('HomeScreen Read Burst (8 Reqs/User)', 250, READ_BURST_ENDPOINTS, 3));
  summary.push(await runMultiTrialTest('HomeScreen Read Burst (8 Reqs/User)', 500, READ_BURST_ENDPOINTS, 3));

  // Write-Path Auth/Identifier Burst
  summary.push(await runMultiTrialTest('Auth Write-Path Burst (3 Reqs/User)', 100, WRITE_BURST_ENDPOINTS, 3));
  summary.push(await runMultiTrialTest('Auth Write-Path Burst (3 Reqs/User)', 250, WRITE_BURST_ENDPOINTS, 3));
  summary.push(await runMultiTrialTest('Auth Write-Path Burst (3 Reqs/User)', 500, WRITE_BURST_ENDPOINTS, 3));

  console.log(`\n\n==================================================`);
  console.log(`🏆 FINAL 3-TRIAL AVERAGED BURST RESULTS TABLE`);
  console.log(`==================================================`);
  console.table(summary);
}

runAllSuites();

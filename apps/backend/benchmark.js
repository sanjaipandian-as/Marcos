import http from 'http';

const keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 1000, keepAliveMsecs: 10000 });

const BASE_URL = 'http://localhost:5000';

const ENDPOINTS = [
  { name: 'Root Health Check', path: '/', method: 'GET' },
  { name: 'Get Products (Cached)', path: '/api/v1/products?page=1&limit=20', method: 'GET' },
  { name: 'Get Categories', path: '/api/v1/categories', method: 'GET' },
  { name: 'Get Active Banners', path: '/api/v1/banners', method: 'GET' },
  { name: 'Get Active Offers', path: '/api/v1/offers/active', method: 'GET' },
  { name: 'Get Public Store Locations', path: '/api/v1/stores', method: 'GET' },
  { name: 'Get Active Promos', path: '/api/v1/promos/active', method: 'GET' },
  { 
    name: 'Check Identifier (No Delay Floor)', 
    path: '/api/v1/auth/check-identifier', 
    method: 'POST',
    body: JSON.stringify({ identifier: 'test@example.com' })
  },
];

const DURATION_SECONDS = 5;
const CONCURRENCY = 200;

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.path, BASE_URL);
    const start = process.hrtime.bigint();

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: endpoint.method,
      agent: keepAliveAgent,
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let dataLength = 0;
      res.on('data', (chunk) => {
        dataLength += chunk.length;
      });

      res.on('end', () => {
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1e6;
        resolve({
          statusCode: res.statusCode,
          latencyMs,
          bytes: dataLength,
          compressed: res.headers['content-encoding'] === 'gzip',
        });
      });
    });

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1e6;
      resolve({
        statusCode: 0,
        error: err.message,
        latencyMs,
        bytes: 0,
      });
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    req.end();
  });
}

async function benchmarkEndpoint(endpoint) {
  console.log(`\n--------------------------------------------------`);
  console.log(`🚀 Benchmarking: ${endpoint.name} [${endpoint.method} ${endpoint.path}]`);
  console.log(`   Concurrency: ${CONCURRENCY} workers | Duration: ${DURATION_SECONDS}s`);

  const results = [];
  let stop = false;
  const startTime = Date.now();

  async function worker() {
    while (!stop) {
      const result = await makeRequest(endpoint);
      results.push(result);
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());

  setTimeout(() => {
    stop = true;
  }, DURATION_SECONDS * 1000);

  await Promise.all(workers);
  const totalDurationSec = (Date.now() - startTime) / 1000;

  // Analysis
  const totalRequests = results.length;
  const rps = (totalRequests / totalDurationSec).toFixed(2);
  const statusCounts = {};
  const errorCounts = {};
  const latencies = results.map(r => r.latencyMs).sort((a, b) => a - b);
  let totalBytes = 0;
  let compressedCount = 0;

  results.forEach(r => {
    statusCounts[r.statusCode] = (statusCounts[r.statusCode] || 0) + 1;
    if (r.error) {
      errorCounts[r.error] = (errorCounts[r.error] || 0) + 1;
    }
    totalBytes += r.bytes;
    if (r.compressed) compressedCount++;
  });

  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)).toFixed(2);
  const p50 = latencies[Math.floor(latencies.length * 0.50)]?.toFixed(2) || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2) || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2) || 0;
  const minLatency = latencies[0]?.toFixed(2) || 0;
  const maxLatency = latencies[latencies.length - 1]?.toFixed(2) || 0;
  const avgBytes = (totalBytes / (totalRequests || 1)).toFixed(0);

  console.log(`\n📊 Benchmark Results for ${endpoint.name}:`);
  console.log(`   • Total Requests:    ${totalRequests}`);
  console.log(`   • Throughput (RPS):  ${rps} req/sec`);
  console.log(`   • Latency Min/Avg:   ${minLatency}ms / ${avgLatency}ms`);
  console.log(`   • Latency P50/P95:   ${p50}ms / ${p95}ms`);
  console.log(`   • Latency Max/P99:   ${maxLatency}ms / ${p99}ms`);
  console.log(`   • Avg Payload Size:  ${avgBytes} bytes (${compressedCount > 0 ? 'gzipped' : 'raw'})`);
  console.log(`   • Status Codes:      ${JSON.stringify(statusCounts)}`);
  if (Object.keys(errorCounts).length > 0) {
    console.log(`   • Socket Errors:     ${JSON.stringify(errorCounts)}`);
  }
  
  return {
    name: endpoint.name,
    path: endpoint.path,
    rps,
    avgLatency,
    p95,
    p99,
    statusCounts,
    errorCounts
  };
}

async function runAllBenchmarks() {
  console.log(`==================================================`);
  console.log(`🔥 MARCOS API HIGH-CONCURRENCY PERFORMANCE BENCHMARK`);
  console.log(`==================================================`);

  const summary = [];
  for (const ep of ENDPOINTS) {
    const res = await benchmarkEndpoint(ep);
    summary.push(res);
  }

  console.log(`\n\n==================================================`);
  console.log(`🏆 OVERALL BENCHMARK SUMMARY TABLE`);
  console.log(`==================================================`);
  console.table(summary.map(s => ({
    Endpoint: s.name,
    'Throughput (RPS)': s.rps,
    'Avg Latency (ms)': s.avgLatency,
    'P95 Latency (ms)': s.p95,
    'Status 200': s.statusCounts[200] || 0,
  })));
}

runAllBenchmarks();

import autocannon from 'autocannon';

const BASE_URL = 'http://localhost:5000';
const CONNECTIONS = 1000;
const DURATION = 5;

const ENDPOINTS = [
  { name: 'Root Health Check', path: '/', method: 'GET' },
  { name: 'Get Products (Cached limit=20)', path: '/api/v1/products?page=1&limit=20', method: 'GET' },
  { name: 'Get Categories', path: '/api/v1/categories', method: 'GET' },
  { name: 'Get Active Banners', path: '/api/v1/banners', method: 'GET' },
  { name: 'Get Active Offers', path: '/api/v1/offers/active', method: 'GET' },
  { name: 'Get Public Store Locations', path: '/api/v1/stores', method: 'GET' },
  { name: 'Get Active Promos', path: '/api/v1/promos/active', method: 'GET' },
  { 
    name: 'Check Identifier (Write-Path / Auth)', 
    path: '/api/v1/auth/check-identifier', 
    method: 'POST',
    body: JSON.stringify({ identifier: 'test@example.com' }),
    headers: { 'Content-Type': 'application/json' }
  },
];

async function runBenchmarkForEndpoint(ep) {
  return new Promise((resolve, reject) => {
    console.log(`\n--------------------------------------------------`);
    console.log(`🚀 Autocannon Benchmark: ${ep.name} [${ep.method || 'GET'}]`);
    console.log(`   URL: ${BASE_URL}${ep.path}`);
    console.log(`   ${CONNECTIONS} Concurrent Connections | Duration: ${DURATION}s`);

    const options = {
      url: `${BASE_URL}${ep.path}`,
      method: ep.method || 'GET',
      connections: CONNECTIONS,
      duration: DURATION,
      pipelining: 1,
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        ...(ep.headers || {}),
      },
    };

    if (ep.body) {
      options.body = ep.body;
    }

    const instance = autocannon(options, (err, result) => {
      if (err) return reject(err);

      console.log(`\n📊 Autocannon Results for ${ep.name}:`);
      console.log(`   • Total Requests:    ${result.requests.total}`);
      console.log(`   • Throughput (RPS):  ${result.requests.average} req/sec`);
      console.log(`   • Latency Average:   ${result.latency.average} ms`);
      console.log(`   • Latency P50:       ${result.latency.p50} ms`);
      console.log(`   • Latency P95:       ${result.latency.p97_5} ms`);
      console.log(`   • Latency P99:       ${result.latency.p99} ms`);
      console.log(`   • 2xx / 4xx / 5xx:   ${result['2xx']} / ${result['4xx']} / ${result['5xx']}`);
      console.log(`   • Socket Errors:     ${result.errors} | Timeouts: ${result.timeouts}`);

      resolve({
        name: ep.name,
        method: ep.method || 'GET',
        rps: result.requests.average,
        avgLatency: result.latency.average,
        p50: result.latency.p50,
        p95: result.latency.p97_5,
        p99: result.latency.p99,
        success2xx: result['2xx'],
        client4xx: result['4xx'],
        server5xx: result['5xx'],
        errors: result.errors + result.timeouts,
      });
    });

    autocannon.track(instance, { renderProgressBar: false });
  });
}

async function runAll() {
  console.log(`==================================================`);
  console.log(`🔥 MARCOS STRESS TEST: ${CONNECTIONS} CONCURRENT CONNECTIONS`);
  console.log(`==================================================`);

  const summary = [];
  for (const ep of ENDPOINTS) {
    const res = await runBenchmarkForEndpoint(ep);
    summary.push(res);
  }

  console.log(`\n\n==================================================`);
  console.log(`🏆 AUTOCANNON ${CONNECTIONS} CONNECTIONS SUMMARY TABLE`);
  console.log(`==================================================`);
  console.table(summary);
}

runAll();

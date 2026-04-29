const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, hasData: data.length > 100 });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

(async () => {
  console.log('=== 测试 API 端点 ===\n');
  
  const endpoints = [
    '/api/xueqiu/portfolio/ZH1038355/metrics',
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.error) {
      console.log(`✗ ${endpoint}: ${result.error}`);
    } else if (result.status === 500) {
      console.log(`✗ ${endpoint}: HTTP ${result.status}`);
    } else {
      console.log(`✓ ${endpoint}: HTTP ${result.status}`);
    }
  }
})();

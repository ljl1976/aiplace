const { chromium } = require('@playwright/test');
const crypto = require('crypto');

const BASE_URL = 'http://192.3.28.56:3000';
const EMAIL = 'lijl@wzgroup.cn';
const SECRET_KEY = 'aiplace_auto_login_secret_key_change_this_in_production_2026';

function generateAutoLoginToken(email) {
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const data = `${email}_${currentHour}`;
  return crypto.createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex')
    .substring(0, 32);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  console.log('=== Auto-login ===');
  const token = generateAutoLoginToken(EMAIL);
  await page.goto(`${BASE_URL}/api/auth/auto-login?email=${encodeURIComponent(EMAIL)}&token=${token}`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(2000);

  console.log('\n=== Navigate to xueqiu-portfolio ===');
  await page.goto(`${BASE_URL}/dashboard/xueqiu-portfolio?portfolio=ZH1038353`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(3000);

  const bodyText = await page.textContent('body');

  console.log('\n=== Check Key Metrics ===');
  console.log('- Has 关键指标:', bodyText.includes('关键指标'));
  console.log('- Has 加载中:', bodyText.includes('加载中'));
  console.log('- Has 观察要点:', bodyText.includes('观察要点'));
  console.log('- Has 日收益率:', bodyText.includes('日收益率'));
  console.log('- Has 总收益率:', bodyText.includes('总收益率'));
  console.log('- Has 253.35:', bodyText.includes('253.35'));

  if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(e => console.log('ERROR:', e));
  } else {
    console.log('\n✓ No errors!');
  }

  await page.screenshot({ path: 'test-results/metrics-check.png', fullPage: true });
  await browser.close();
  console.log('\n=== Done ===');
})();

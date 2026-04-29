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

  // Step 1: Auto-login
  console.log('=== Step 1: Auto-login ===');
  const token = generateAutoLoginToken(EMAIL);
  await page.goto(`${BASE_URL}/api/auth/auto-login?email=${encodeURIComponent(EMAIL)}&token=${token}`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(2000);
  console.log('Logged in, current URL:', page.url());

  // Step 2: Navigate to xueqiu-portfolio page
  console.log('\n=== Step 2: Navigate to Xueqiu Portfolio ===');
  await page.goto(`${BASE_URL}/dashboard/xueqiu-portfolio`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(3000);
  console.log('Page URL:', page.url());

  const bodyText = await page.textContent('body');

  // Step 3: Verify page content
  console.log('\n=== Step 3: Verify Page Content ===');
  console.log('- Has 雪球组合:', bodyText.includes('雪球组合'));
  console.log('- Has 关键指标:', bodyText.includes('关键指标'));
  console.log('- Has 持仓明细:', bodyText.includes('持仓明细'));
  console.log('- Has 调仓历史:', bodyText.includes('调仓历史'));

  // Get the default portfolio name (should be 价值投资长线组合 since it's first alphabetically)
  const portfolioName = bodyText.includes('价值投资长线组合') ? '价值投资长线组合' :
                        bodyText.includes('主题投资组合') ? '主题投资组合' : 'Unknown';
  console.log('- Default portfolio:', portfolioName);

  // Check for observations (only 价值投资长线组合 has it)
  console.log('- Has 观察要点:', bodyText.includes('观察要点'));
  console.log('- Has 操作风格:', bodyText.includes('操作风格'));

  // Check latest rebalance
  const hasLatestRebalance = bodyText.includes('最新调仓');
  console.log('- Has 最新调仓:', hasLatestRebalance);
  if (hasLatestRebalance) {
    const rebalanceMatch = bodyText.match(/最新调仓\n?([\s\S]{0,50})/);
    if (rebalanceMatch) {
      console.log('  Latest rebalance preview:', rebalanceMatch[0].replace(/\n/g, ' ').substring(0, 50));
    }
  }

  // Step 4: Test portfolio switching
  console.log('\n=== Step 4: Test Portfolio Switching ===');

  // Find and click the portfolio selector
  const selectTrigger = await page.$('[role="combobox"]');
  if (selectTrigger) {
    console.log('Found portfolio selector, clicking...');
    await selectTrigger.click();
    await page.waitForTimeout(500);

    // Get all options
    const options = await page.$$eval('[role="option"]', opts => opts.map(o => o.textContent));
    console.log('Available portfolios:', options);

    // Click on the second option (主题投资组合)
    if (options.length > 1) {
      const secondOption = await page.$('[role="option"]:nth-child(2)');
      if (secondOption) {
        await secondOption.click();
        await page.waitForTimeout(3000);

        const newBodyText = await page.textContent('body');
        console.log('After switching:');
        console.log('- Has 主题投资组合:', newBodyText.includes('主题投资组合'));
        console.log('- Has 观察要点 (should be false):', newBodyText.includes('观察要点'));
        console.log('- Has 阳光电源:', newBodyText.includes('阳光电源'));

        // Switch back to first portfolio
        console.log('\nSwitching back to first portfolio...');
        const selectTrigger2 = await page.$('[role="combobox"]');
        await selectTrigger2.click();
        await page.waitForTimeout(500);

        const firstOption = await page.$('[role="option"]:nth-child(1)');
        if (firstOption) {
          await firstOption.click();
          await page.waitForTimeout(3000);

          const switchBackText = await page.textContent('body');
          console.log('After switching back:');
          console.log('- Has 价值投资长线组合:', switchBackText.includes('价值投资长线组合'));
          console.log('- Has 宝丰能源:', switchBackText.includes('宝丰能源'));
        }
      }
    }
  } else {
    console.log('Portfolio selector not found!');
  }

  // Step 5: Check for errors
  console.log('\n=== Step 5: Error Check ===');
  if (errors.length > 0) {
    console.log('Console errors found:');
    errors.forEach(err => console.log('  ERROR:', err));
  } else {
    console.log('✓ No console errors!');
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/xueqiu-final.png', fullPage: true });
  console.log('\nScreenshot saved to test-results/xueqiu-final.png');

  await browser.close();
  console.log('\n=== Test Completed ===');
})();

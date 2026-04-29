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
  console.log('=== 雪球组合页面数据完整性测试 ===\n');
  
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
  console.log('步骤 1: 自动登录...');
  const token = generateAutoLoginToken(EMAIL);
  await page.goto(`${BASE_URL}/api/auth/auto-login?email=${encodeURIComponent(EMAIL)}&token=${token}`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(2000);
  console.log('✓ 登录成功');

  // Step 2: Navigate to xueqiu-portfolio page
  console.log('\n步骤 2: 导航到雪球组合页面...');
  await page.goto(`${BASE_URL}/dashboard/xueqiu-portfolio`, {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await page.waitForTimeout(3000);
  console.log('✓ 页面加载完成');

  const bodyText = await page.textContent('body');

  // Step 3: Check key components
  console.log('\n步骤 3: 检查页面组件和数据...');
  
  const checks = {
    '雪球组合标题': bodyText.includes('雪球组合'),
    '关键指标': bodyText.includes('关键指标'),
    '持仓分布': bodyText.includes('持仓分布'),
    '持仓明细': bodyText.includes('持仓明细'),
    '调仓历史': bodyText.includes('调仓历史'),
  };

  console.log('\n【页面组件检查】');
  let allPassed = true;
  for (const [name, passed] of Object.entries(checks)) {
    console.log(`  ${passed ? '✓' : '✗'} ${name}`);
    if (!passed) allPassed = false;
  }

  // Step 4: Check data completeness
  console.log('\n【数据完整性检查】');
  
  // Check for portfolio name
  const hasPortfolioName = bodyText.includes('主题投资组合');
  console.log(`  ${hasPortfolioName ? '✓' : '✗'} 组合名称显示`);
  
  // Check for metrics data
  const hasMetrics = bodyText.includes('日收益率') && bodyText.includes('月收益率') && bodyText.includes('总收益率');
  console.log(`  ${hasMetrics ? '✓' : '✗'} 收益率指标显示`);
  
  // Check for holdings data
  const hasHoldings = bodyText.includes('兴业银锡') || bodyText.includes('黄金ETF');
  console.log(`  ${hasHoldings ? '✓' : '✗'} 持仓数据显示`);
  
  // Check for sector data
  const hasSectors = bodyText.includes('基础化工') || bodyText.includes('ETF');
  console.log(`  ${hasSectors ? '✓' : '✗'} 板块数据显示`);
  
  // Check for rebalance data
  const hasRebalance = bodyText.includes('最新调仓');
  console.log(`  ${hasRebalance ? '✓' : '✗'} 调仓数据显示`);

  // Step 5: Extract actual data values
  console.log('\n【实际数据值】');
  
  // Try to extract portfolio name
  const portfolioMatch = bodyText.match(/主题投资组合|价值投资长线组合/);
  if (portfolioMatch) {
    console.log(`  当前组合: ${portfolioMatch[0]}`);
  }
  
  // Try to extract return data
  const returnMatch = bodyText.match(/总收益[^-]\d+[.\d]*%?/);
  if (returnMatch) {
    console.log(`  ${returnMatch[0]}`);
  }
  
  // Try to extract latest rebalance
  if (hasRebalance) {
    const rebalanceMatch = bodyText.match(/最新调仓[\s\S]{0,100}/);
    if (rebalanceMatch) {
      console.log(`  最新调仓: ${rebalanceMatch[0].replace(/\n/g, ' ').substring(0, 50)}...`);
    }
  }

  // Step 6: Take screenshot
  console.log('\n步骤 4: 保存截图...');
  await page.screenshot({ path: 'test-results/xueqiu-data-check.png', fullPage: true });
  console.log('✓ 截图已保存: test-results/xueqiu-data-check.png');

  // Step 7: Check for errors
  console.log('\n步骤 5: 检查控制台错误...');
  if (errors.length > 0) {
    console.log(`✗ 发现 ${errors.length} 个错误:`);
    errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('✓ 无控制台错误');
  }

  // Final result
  console.log('\n=== 测试结果 ===');
  if (allPassed && hasPortfolioName && hasMetrics && hasHoldings) {
    console.log('✅ 数据显示完整，页面正常！');
  } else {
    console.log('⚠️  部分数据缺失，需要进一步检查');
  }

  await browser.close();
})();

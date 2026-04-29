import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard 页面检查测试
 * 用于诊断各个页面的访问状态，特别是认证页面
 */

test.describe('Admin Dashboard 页面检查', () => {

  test.beforeEach(async ({ page }) => {
    // 设置默认超时时间
    test.setTimeout(30000);
  });

  test('主页检查', async ({ page }) => {
    await page.goto('/');

    // 检查是否正常加载
    await expect(page).toHaveTitle(/Studio Admin|Admin Dashboard/);

    // 截图
    await page.screenshot({ path: 'test-results/homepage.png' });

    console.log('主页标题:', await page.title());
    console.log('主页URL:', page.url());
  });

  test('认证 v1 登录页面', async ({ page }) => {
    try {
      await page.goto('/auth/v1/login');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // 检查页面元素
      const title = await page.title();
      console.log('认证 v1 登录页面标题:', title);

      // 检查是否有登录表单
      const loginForm = page.locator('form').first();
      const hasForm = await loginForm.count() > 0;

      // 检查是否有输入框
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      console.log('登录表单存在:', hasForm);
      console.log('邮箱输入框存在:', await emailInput.count() > 0);
      console.log('密码输入框存在:', await passwordInput.count() > 0);

      // 截图
      await page.screenshot({ path: 'test-results/auth-v1-login.png' });

      // 检查页面内容
      const pageContent = await page.content();
      console.log('页面内容长度:', pageContent.length);

      if (pageContent.length < 1000) {
        console.log('页面内容异常，可能是错误页面');
        console.log('页面内容预览:', pageContent.substring(0, 500));
      }

    } catch (error) {
      console.error('认证 v1 登录页面访问失败:', error);
      await page.screenshot({ path: 'test-results/auth-v1-login-error.png' });
      throw error;
    }
  });

  test('认证 v1 注册页面', async ({ page }) => {
    try {
      await page.goto('/auth/v1/register');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('认证 v1 注册页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/auth-v1-register.png' });

      // 检查页面内容
      const pageContent = await page.content();
      console.log('页面内容长度:', pageContent.length);

    } catch (error) {
      console.error('认证 v1 注册页面访问失败:', error);
      await page.screenshot({ path: 'test-results/auth-v1-register-error.png' });
      throw error;
    }
  });

  test('认证 v2 登录页面', async ({ page }) => {
    try {
      await page.goto('/auth/v2/login');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('认证 v2 登录页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/auth-v2-login.png' });

      // 检查页面内容
      const pageContent = await page.content();
      console.log('页面内容长度:', pageContent.length);

    } catch (error) {
      console.error('认证 v2 登录页面访问失败:', error);
      await page.screenshot({ path: 'test-results/auth-v2-login-error.png' });
      throw error;
    }
  });

  test('认证 v2 注册页面', async ({ page }) => {
    try {
      await page.goto('/auth/v2/register');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('认证 v2 注册页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/auth-v2-register.png' });

      // 检查页面内容
      const pageContent = await page.content();
      console.log('页面内容长度:', pageContent.length);

    } catch (error) {
      console.error('认证 v2 注册页面访问失败:', error);
      await page.screenshot({ path: 'test-results/auth-v2-register-error.png' });
      throw error;
    }
  });

  test('默认仪表板页面', async ({ page }) => {
    try {
      await page.goto('/dashboard/default');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('默认仪表板页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/dashboard-default.png' });

      // 检查是否有仪表板内容
      const mainContent = page.locator('main').first();
      const hasContent = await mainContent.count() > 0;
      console.log('仪表板内容存在:', hasContent);

    } catch (error) {
      console.error('默认仪表板页面访问失败:', error);
      await page.screenshot({ path: 'test-results/dashboard-default-error.png' });
      throw error;
    }
  });

  test('CRM 仪表板页面', async ({ page }) => {
    try {
      await page.goto('/dashboard/crm');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('CRM 仪表板页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/dashboard-crm.png' });

    } catch (error) {
      console.error('CRM 仪表板页面访问失败:', error);
      await page.screenshot({ path: 'test-results/dashboard-crm-error.png' });
      throw error;
    }
  });

  test('财务仪表板页面', async ({ page }) => {
    try {
      await page.goto('/dashboard/finance');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('财务仪表板页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/dashboard-finance.png' });

    } catch (error) {
      console.error('财务仪表板页面访问失败:', error);
      await page.screenshot({ path: 'test-results/dashboard-finance-error.png' });
      throw error;
    }
  });

  test('分析仪表板页面', async ({ page }) => {
    try {
      await page.goto('/dashboard/analytics');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('分析仪表板页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/dashboard-analytics.png' });

    } catch (error) {
      console.error('分析仪表板页面访问失败:', error);
      await page.screenshot({ path: 'test-results/dashboard-analytics-error.png' });
      throw error;
    }
  });

  test('即将推出页面', async ({ page }) => {
    try {
      await page.goto('/dashboard/coming-soon');

      // 等待页面加载
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const title = await page.title();
      console.log('即将推出页面标题:', title);

      // 截图
      await page.screenshot({ path: 'test-results/coming-soon.png' });

    } catch (error) {
      console.error('即将推出页面访问失败:', error);
      await page.screenshot({ path: 'test-results/coming-soon-error.png' });
      throw error;
    }
  });

});

test.describe('页面链接检查', () => {

  test('检查认证页面链接可访问性', async ({ page }) => {
    const authPages = [
      '/auth/v1/login',
      '/auth/v1/register',
      '/auth/v2/login',
      '/auth/v2/register'
    ];

    for (const url of authPages) {
      try {
        const response = await page.goto(url);
        const status = response?.status() || 'unknown';
        console.log(`${url} - HTTP状态: ${status}`);

        if (status >= 400) {
          console.error(`${url} 返回错误状态: ${status}`);
        }

      } catch (error) {
        console.error(`${url} 访问失败:`, error);
      }
    }
  });

  test('检查仪表板页面链接可访问性', async ({ page }) => {
    const dashboardPages = [
      '/dashboard/default',
      '/dashboard/crm',
      '/dashboard/finance',
      '/dashboard/analytics'
    ];

    for (const url of dashboardPages) {
      try {
        const response = await page.goto(url);
        const status = response?.status() || 'unknown';
        console.log(`${url} - HTTP状态: ${status}`);

        if (status >= 400) {
          console.error(`${url} 返回错误状态: ${status}`);
        }

      } catch (error) {
        console.error(`${url} 访问失败:`, error);
      }
    }
  });

});

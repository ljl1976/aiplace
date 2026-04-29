import { test, expect } from '@playwright/test';

/**
 * 简单的页面检查测试
 * 专注于认证页面的基本访问性
 */

test.describe('认证页面基本检查', () => {

  test.beforeAll(async () => {
    // 确保服务器正在运行
    console.log('开始测试前，请确保开发服务器正在运行: pnpm run dev');
  });

  test('认证 v1 登录页面基本检查', async ({ page }) => {
    test.setTimeout(30000);

    try {
      console.log('访问认证 v1 登录页面...');
      const response = await page.goto('/auth/v1/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      if (response) {
        console.log(`HTTP 状态码: ${response.status()}`);
        console.log(`响应 URL: ${response.url()}`);
      }

      // 等待页面加载
      await page.waitForTimeout(3000);

      // 获取页面标题
      const title = await page.title();
      console.log(`页面标题: ${title}`);

      // 获取页面 URL
      const url = page.url();
      console.log(`当前 URL: ${url}`);

      // 截图
      await page.screenshot({ path: 'test-results/auth-v1-login-simple.png' });

      // 检查页面内容
      const bodyText = await page.locator('body').textContent();
      console.log(`页面内容长度: ${bodyText?.length || 0}`);

      if (bodyText && bodyText.length > 0) {
        console.log('页面内容预览:', bodyText.substring(0, 200));
      }

      // 检查是否有错误信息
      const hasError = bodyText?.includes('Error') || bodyText?.includes('error');
      console.log('页面包含错误:', hasError);

    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  });

  test('认证 v2 登录页面基本检查', async ({ page }) => {
    test.setTimeout(30000);

    try {
      console.log('访问认证 v2 登录页面...');
      const response = await page.goto('/auth/v2/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      if (response) {
        console.log(`HTTP 状态码: ${response.status()}`);
      }

      await page.waitForTimeout(3000);

      const title = await page.title();
      console.log(`页面标题: ${title}`);

      // 截图
      await page.screenshot({ path: 'test-results/auth-v2-login-simple.png' });

      const bodyText = await page.locator('body').textContent();
      console.log(`页面内容长度: ${bodyText?.length || 0}`);

    } catch (error) {
      console.error('测试失败:', error);
      throw error;
    }
  });

  test('检查所有认证页面路由', async ({ page }) => {
    const authRoutes = [
      '/auth/v1/login',
      '/auth/v1/register',
      '/auth/v2/login',
      '/auth/v2/register'
    ];

    for (const route of authRoutes) {
      try {
        console.log(`检查路由: ${route}`);
        const response = await page.goto(route, {
          waitUntil: 'domcontentloaded',
          timeout: 10000
        });

        const status = response?.status() || 'unknown';
        console.log(`${route} - 状态: ${status}`);

        // 等待一秒
        await page.waitForTimeout(1000);

      } catch (error) {
        console.error(`${route} 访问失败:`, error);
      }
    }
  });

});

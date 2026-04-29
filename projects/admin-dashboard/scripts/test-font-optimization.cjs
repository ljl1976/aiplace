const { chromium } = require('playwright');

/**
 * 字体优化效果测试
 * 对比优化前后的字体加载性能
 */

(async () => {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    console.log('🚀 开始字体优化效果测试...\n');

    const fontLoadingData = {
      googleFontsRequests: [],
      systemFontUsage: false,
      totalFontLoadTime: 0,
      fontCount: 0
    };

    // 监控字体请求
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        console.log(`🔴 检测到Google Fonts请求: ${url.split('/').pop()}`);
        fontLoadingData.googleFontsRequests.push({
          url: url.split('/').pop(),
          type: 'Google Font'
        });
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
        const timing = Date.now();
        fontLoadingData.totalFontLoadTime += (timing - response.request().timing().startTime);
        fontLoadingData.fontCount++;
        console.log(`📥 Google Fonts响应: ${url.split('/').pop()}`);
      }
    });

    console.log('⏱️ 正在加载页面...\n');
    const startTime = Date.now();

    await page.goto('http://localhost:3000/dashboard/default', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const loadTime = Date.now() - startTime;

    // 检查字体使用情况
    const fontAnalysis = await page.evaluate(() => {
      const computedStyles = window.getComputedStyle(document.body);
      const fontFamily = computedStyles.fontFamily;

      // 检查是否使用系统字体
      const usesSystemFonts = fontFamily.includes('system-ui') ||
                             fontFamily.includes('-apple-system') ||
                             fontFamily.includes('BlinkMacSystemFont') ||
                             fontFamily.includes('Segoe UI') ||
                             fontFamily.includes('PingFang SC') ||
                             fontFamily.includes('Microsoft YaHei');

      return {
        fontFamily,
        usesSystemFonts,
        fontStack: fontFamily.split(',').map(f => f.trim())
      };
    });

    fontLoadingData.systemFontUsage = fontAnalysis.usesSystemFonts;

    // 获取性能指标
    const metrics = await page.evaluate(() => {
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      const paintTiming = performance.getEntriesByType('paint');

      const fcp = paintTiming.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      const lcp = paintTiming.find(p => p.name === 'largest-contentful-paint')?.startTime || 0;

      const resourceTiming = performance.getEntriesByType('resource');
      const fontResources = resourceTiming.filter(r =>
        r.name.includes('fonts.googleapis.com') || r.name.includes('fonts.gstatic.com')
      );

      return {
        ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
        domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.requestStart,
        pageLoad: navigationTiming.loadEventEnd - navigationTiming.requestStart,
        fcp,
        lcp,
        fontResourcesCount: fontResources.length,
        fontLoadTime: fontResources.reduce((acc, r) => acc + r.duration, 0)
      };
    });

    console.log('\n📊 字体优化效果分析:\n');
    console.log('═══════════════════════════════════════════════════════');

    // Google Fonts使用情况
    console.log('🔍 Google Fonts 使用情况:');
    if (fontLoadingData.googleFontsRequests.length === 0) {
      console.log('   ✅ 无Google Fonts请求 - 优化成功！');
    } else {
      console.log(`   ⚠️  仍有 ${fontLoadingData.googleFontsRequests.length} 个Google Fonts请求`);
      fontLoadingData.googleFontsRequests.forEach(font => {
        console.log(`     • ${font.url}`);
      });
    }

    // 系统字体使用情况
    console.log('\n🎯 系统字体使用情况:');
    console.log(`   ${fontLoadingData.systemFontUsage ? '✅' : '❌'} 使用系统字体栈`);
    console.log(`   📝 当前字体栈: ${fontAnalysis.fontStack.slice(0, 3).join(', ')}...`);

    // 性能对比
    console.log('\n📈 性能指标对比:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`   总页面加载时间: ${loadTime}ms`);
    console.log(`   TTFB: ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`   DOM内容加载: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   首次内容绘制 (FCP): ${metrics.fcp.toFixed(2)}ms`);
    console.log(`   最大内容绘制 (LCP): ${metrics.lcp.toFixed(2)}ms`);

    if (metrics.fontResourcesCount === 0) {
      console.log(`   字体加载时间: 0ms (使用系统字体)`);
    } else {
      console.log(`   字体加载时间: ${metrics.fontLoadTime.toFixed(2)}ms (${metrics.fontResourcesCount}个文件)`);
    }

    // 优化效果评估
    console.log('\n🎉 优化效果评估:');
    console.log('═══════════════════════════════════════════════════════');

    const previousFontLoadTime = 5346; // 之前的字体加载时间
    const improvement = previousFontLoadTime - (metrics.fontLoadTime || 0);
    const improvementPercent = ((improvement / previousFontLoadTime) * 100).toFixed(1);

    if (fontLoadingData.googleFontsRequests.length === 0 && fontLoadingData.systemFontUsage) {
      console.log(`🏆 优化成功！字体加载时间减少: ${previousFontLoadTime}ms → 0ms`);
      console.log(`   性能提升: ${improvementPercent}%`);
      console.log(`   节省时间: ${improvement}ms`);
    } else if (fontLoadingData.googleFontsRequests.length < 10) {
      console.log(`⚠️  部分优化: Google Fonts请求减少`);
      console.log(`   仍需优化: ${fontLoadingData.googleFontsRequests.length} 个外部请求`);
    } else {
      console.log(`❌ 优化未生效: 仍使用Google Fonts`);
      console.log(`   建议检查配置文件`);
    }

    // 预期效果
    console.log('\n💡 预期优化效果 (与之前对比):');
    console.log('─────────────────────────────────────────────────────');
    console.log(`   字体加载: 5,346ms → ${metrics.fontLoadTime ? metrics.fontLoadTime.toFixed(0) : '0'}ms`);
    console.log(`   总加载时间: ~4,194ms → ${loadTime}ms`);

    if (metrics.fontLoadTime === 0) {
      console.log(`   预期提升: ~90% 字体加载时间减少`);
      console.log(`   网络请求: 减少24个字体文件请求`);
    }

    console.log('\n📸 生成性能截图...');
    await page.screenshot({
      path: `font-optimization-result-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✅ 性能测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error.message);
  } finally {
    await browser.close();
  }
})();
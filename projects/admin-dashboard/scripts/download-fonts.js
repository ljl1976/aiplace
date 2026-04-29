#!/usr/bin/env node

/**
 * 字体下载脚本
 * 从 Google Fonts 下载必要的字体文件到本地
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 字体下载配置
const FONTS = [
  {
    name: 'Inter',
    filename: 'Inter.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2'
  },
  {
    name: 'Roboto',
    filename: 'Roboto.woff2',
    url: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'
  },
  {
    name: 'Geist',
    filename: 'Geist.woff2',
    url: 'https://fonts.gstatic.com/s/geist/v1/gyByhwUxXdZEqIMeVmxe.woff2'
  },
  {
    name: 'NotoSans',
    filename: 'NotoSans.woff2',
    url: 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A-9a6Vjki0.woff2'
  },
  {
    name: 'Outfit',
    filename: 'Outfit.woff2',
    url: 'https://fonts.gstatic.com/s/outfit/v11/QGYvz_MVcBeNP4NJuktE2gY.woff2'
  },
  {
    name: 'GeistMono',
    filename: 'GeistMono.woff2',
    url: 'https://fonts.gstatic.com/s/geistmono/v1/fCh1706Nbw_EAW0X1YkGYMF7eZGX9sNoCuXG6w.woff2'
  }
];

// 下载单个字体文件
function downloadFont(font) {
  return new Promise((resolve, reject) => {
    const fontPath = path.join(__dirname, '../public/fonts', font.filename);

    console.log(`正在下载 ${font.name}...`);

    const file = fs.createWriteStream(fontPath);

    https.get(font.url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`✅ ${font.name} 下载完成`);
          resolve();
        });
      } else {
        fs.unlink(fontPath, () => {}); // 删除部分下载的文件
        reject(new Error(`下载 ${font.name} 失败: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(fontPath, () => {}); // 删除部分下载的文件
      reject(err);
    });
  });
}

// 主函数
async function main() {
  console.log('🚀 开始下载本地字体文件...\n');

  // 确保字体目录存在
  const fontsDir = path.join(__dirname, '../public/fonts');
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }

  try {
    // 并发下载所有字体
    await Promise.all(FONTS.map(downloadFont));

    console.log('\n🎉 所有字体下载完成！');
    console.log(`📁 字体文件保存在: ${fontsDir}`);

  } catch (error) {
    console.error('❌ 字体下载失败:', error.message);
    process.exit(1);
  }
}

// 运行脚本
main();
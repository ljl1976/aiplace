/**
 * 优化的字体配置
 * 使用系统字体栈替代 Google Fonts，大幅提升加载性能
 */

// 使用本地系统字体，无需下载
const createSystemFont = (fontStack: string, variable: string) => ({
  variable,
  className: variable.replace('--font-', '')
});

// 主要字体配置 - 使用系统字体栈
const systemFonts = {
  // Inter 替代方案：使用系统默认字体栈
  inter: createSystemFont(
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '--font-inter'
  ),

  // 中文字体支持
  notoSans: createSystemFont(
    '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    '--font-noto-sans'
  ),

  // Roboto 替代方案
  roboto: createSystemFont(
    '"Roboto", "Helvetica Neue", Arial, sans-serif',
    '--font-roboto'
  ),

  // Geist 替代方案
  geist: createSystemFont(
    'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    '--font-geist'
  ),

  // 其他字体的系统替代
  outfit: createSystemFont(
    '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    '--font-outfit'
  ),

  geistMono: createSystemFont(
    '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
    '--font-geist-mono'
  ),

  dmSans: createSystemFont(
    '"Helvetica Neue", Arial, sans-serif',
    '--font-dm-sans'
  ),

  nunitoSans: createSystemFont(
    '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    '--font-nunito-sans'
  ),

  figtree: createSystemFont(
    '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    '--font-figtree'
  ),

  raleway: createSystemFont(
    '"Helvetica Neue", Arial, sans-serif',
    '--font-raleway'
  ),

  publicSans: createSystemFont(
    'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    '--font-public-sans'
  ),

  jetBrainsMono: createSystemFont(
    '"SF Mono", "Monaco", "Cascadia Code", monospace',
    '--font-jetbrains-mono'
  ),

  notoSerif: createSystemFont(
    '"Georgia", "Times New Roman", serif',
    '--font-noto-serif'
  ),

  robotoSlab: createSystemFont(
    '"Rockwell", "Georgia", serif',
    '--font-roboto-slab'
  ),

  merriweather: createSystemFont(
    '"Georgia", "Times New Roman", serif',
    '--font-merriweather'
  ),

  lora: createSystemFont(
    '"Georgia", "Times New Roman", serif',
    '--font-lora'
  ),

  playfairDisplay: createSystemFont(
    '"Georgia", "Times New Roman", serif',
    '--font-playfair-display'
  ),
};

// 导出字体注册表（与原文件保持兼容）
export const fontRegistry = {
  geist: {
    label: "Geist (System)",
    font: systemFonts.geist,
  },
  inter: {
    label: "Inter (System)",
    font: systemFonts.inter,
  },
  notoSans: {
    label: "Noto Sans (System)",
    font: systemFonts.notoSans,
  },
  nunitoSans: {
    label: "Nunito Sans (System)",
    font: systemFonts.nunitoSans,
  },
  figtree: {
    label: "Figtree (System)",
    font: systemFonts.figtree,
  },
  roboto: {
    label: "Roboto (System)",
    font: systemFonts.roboto,
  },
  raleway: {
    label: "Raleway (System)",
    font: systemFonts.raleway,
  },
  dmSans: {
    label: "DM Sans (System)",
    font: systemFonts.dmSans,
  },
  publicSans: {
    label: "Public Sans (System)",
    font: systemFonts.publicSans,
  },
  outfit: {
    label: "Outfit (System)",
    font: systemFonts.outfit,
  },
  geistMono: {
    label: "Geist Mono (System)",
    font: systemFonts.geistMono,
  },
  geistPixelSquare: {
    label: "Geist Pixel Square (System)",
    font: systemFonts.geistMono, // 使用等宽字体替代
  },
  jetBrainsMono: {
    label: "JetBrains Mono (System)",
    font: systemFonts.jetBrainsMono,
  },
  notoSerif: {
    label: "Noto Serif (System)",
    font: systemFonts.notoSerif,
  },
  robotoSlab: {
    label: "Roboto Slab (System)",
    font: systemFonts.robotoSlab,
  },
  merriweather: {
    label: "Merriweather (System)",
    font: systemFonts.merriweather,
  },
  lora: {
    label: "Lora (System)",
    font: systemFonts.lora,
  },
  playfairDisplay: {
    label: "Playfair Display (System)",
    font: systemFonts.playfairDisplay,
  },
} as const;

export type FontKey = keyof typeof fontRegistry;

// 生成字体变量字符串（保持兼容性）
export const fontVars = Object.values(fontRegistry)
  .map(f => f.font.variable)
  .join(" ");

export const fontOptions = (Object.entries(fontRegistry) as Array<[FontKey, (typeof fontRegistry)[FontKey]]>).map(
  ([key, f]) => ({
    key,
    label: f.label,
    variable: f.font.variable,
  }),
);

// 优化后的字体样式配置
export const fontStyles = `
  :root {
    --font-inter: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-noto-sans: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
    --font-roboto: "Roboto", "Helvetica Neue", Arial, sans-serif;
    --font-geist: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    --font-geist-mono: "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace;
    --font-jetbrains-mono: "SF Mono", "Monaco", "Cascadia Code", monospace;
  }

  /* 针对中文优化的字体栈 */
  html[lang="zh-CN"] {
    --font-inter: "PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --font-noto-sans: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  }
`;
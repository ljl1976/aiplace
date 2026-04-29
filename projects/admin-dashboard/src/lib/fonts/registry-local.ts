/**
 * 本地字体配置
 * 使用系统字体和本地字体文件替代 Google Fonts
 */

import localFont from 'next/font/local'

// 主要本地字体配置
const inter = localFont({
  src: './fonts/Inter.woff2',
  variable: '--font-inter',
  display: 'swap',
})

const roboto = localFont({
  src: './fonts/Roboto.woff2',
  variable: '--font-roboto',
  display: 'swap',
})

const geist = localFont({
  src: './fonts/Geist.woff2',
  variable: '--font-geist',
  display: 'swap',
})

const notoSans = localFont({
  src: './fonts/NotoSans.woff2',
  variable: '--font-noto-sans',
  display: 'swap',
})

// 其他字体的本地配置
const outfit = localFont({
  src: './fonts/Outfit.woff2',
  variable: '--font-outfit',
  display: 'swap',
})

const geistMono = localFont({
  src: './fonts/GeistMono.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
})

const dmSans = localFont({
  src: './fonts/DMSans.woff2',
  variable: '--font-dm-sans',
  display: 'swap',
})

const nunitoSans = localFont({
  src: './fonts/NunitoSans.woff2',
  variable: '--font-nunito-sans',
  display: 'swap',
})

const figtree = localFont({
  src: './fonts/Figtree.woff2',
  variable: '--font-figtree',
  display: 'swap',
})

const raleway = localFont({
  src: './fonts/Raleway.woff2',
  variable: '--font-raleway',
  display: 'swap',
})

const publicSans = localFont({
  src: './fonts/PublicSans.woff2',
  variable: '--font-public-sans',
  display: 'swap',
})

const jetBrainsMono = localFont({
  src: './fonts/JetBrainsMono.woff2',
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const notoSerif = localFont({
  src: './fonts/NotoSerif.woff2',
  variable: '--font-noto-serif',
  display: 'swap',
})

const robotoSlab = localFont({
  src: './fonts/RobotoSlab.woff2',
  variable: '--font-roboto-slab',
  display: 'swap',
})

const merriweather = localFont({
  src: './fonts/Merriweather.woff2',
  variable: '--font-merriweather',
  display: 'swap',
})

const lora = localFont({
  src: './fonts/Lora.woff2',
  variable: '--font-lora',
  display: 'swap',
})

const playfairDisplay = localFont({
  src: './fonts/PlayfairDisplay.woff2',
  variable: '--font-playfair-display',
  display: 'swap',
})

// 导出字体注册表（与原文件保持兼容）
export const fontRegistry = {
  geist: {
    label: "Geist",
    font: geist,
  },
  inter: {
    label: "Inter",
    font: inter,
  },
  notoSans: {
    label: "Noto Sans",
    font: notoSans,
  },
  nunitoSans: {
    label: "Nunito Sans",
    font: nunitoSans,
  },
  figtree: {
    label: "Figtree",
    font: figtree,
  },
  roboto: {
    label: "Roboto",
    font: roboto,
  },
  raleway: {
    label: "Raleway",
    font: raleway,
  },
  dmSans: {
    label: "DM Sans",
    font: dmSans,
  },
  publicSans: {
    label: "Public Sans",
    font: publicSans,
  },
  outfit: {
    label: "Outfit",
    font: outfit,
  },
  geistMono: {
    label: "Geist Mono",
    font: geistMono,
  },
  geistPixelSquare: {
    label: "Geist Pixel Square",
    font: geist, // 暂时使用geist替代
  },
  jetBrainsMono: {
    label: "JetBrains Mono",
    font: jetBrainsMono,
  },
  notoSerif: {
    label: "Noto Serif",
    font: notoSerif,
  },
  robotoSlab: {
    label: "Roboto Slab",
    font: robotoSlab,
  },
  merriweather: {
    label: "Merriweather",
    font: merriweather,
  },
  lora: {
    label: "Lora",
    font: lora,
  },
  playfairDisplay: {
    label: "Playfair Display",
    font: playfairDisplay,
  },
} as const;

export type FontKey = keyof typeof fontRegistry;

export const fontVars = (Object.values(fontRegistry) as Array<(typeof fontRegistry)[FontKey]>)
  .map((f) => f.font.variable)
  .join(" ");

export const fontOptions = (Object.entries(fontRegistry) as Array<[FontKey, (typeof fontRegistry)[FontKey]]>).map(
  ([key, f]) => ({
    key,
    label: f.label,
    variable: f.font.variable,
  }),
);
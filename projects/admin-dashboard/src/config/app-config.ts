import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "新闻分析工作台",
  version: packageJson.version,
  copyright: `© ${currentYear}, 新闻分析工作台.`,
  meta: {
    title: "新闻分析工作台 - 智能新闻分析与管理平台",
    description:
      "新闻分析工作台是一个智能化的新闻分析与管理平台，基于 Next.js 16、Tailwind CSS v4 和 shadcn/ui 构建。提供新闻内容分析、数据监控和智能报告功能 - 完全可定制且生产就绪。",
  },
};

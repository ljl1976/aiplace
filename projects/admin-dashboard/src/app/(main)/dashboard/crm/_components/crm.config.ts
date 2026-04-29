import type { ChartConfig } from "@/components/ui/chart";

export const leadsChartData = [
  { date: "1-5", newLeads: 120, disqualified: 40 },
  { date: "6-10", newLeads: 95, disqualified: 30 },
  { date: "11-15", newLeads: 60, disqualified: 22 },
  { date: "16-20", newLeads: 100, disqualified: 35 },
  { date: "21-25", newLeads: 150, disqualified: 70 },
  { date: "26-30", newLeads: 110, disqualified: 60 },
];

export const leadsChartConfig = {
  newLeads: {
    label: "新线索",
    color: "var(--chart-1)",
  },
  disqualified: {
    label: "不合格",
    color: "var(--chart-3)",
  },
  background: {
    color: "var(--primary)",
  },
} as ChartConfig;

export const proposalsChartData = [
  { date: "1-5", proposalsSent: 9 },
  { date: "6-10", proposalsSent: 16 },
  { date: "11-15", proposalsSent: 6 },
  { date: "16-20", proposalsSent: 18 },
  { date: "21-25", proposalsSent: 11 },
  { date: "26-30", proposalsSent: 14 },
];

export const proposalsChartConfig = {
  proposalsSent: {
    label: "已发送提案",
    color: "var(--chart-1)",
  },
} as ChartConfig;

export const revenueChartData = [
  { month: "Jul 2024", revenue: 6700 },
  { month: "Aug 2024", revenue: 7100 },
  { month: "Sep 2024", revenue: 6850 },
  { month: "Oct 2024", revenue: 7500 },
  { month: "Nov 2024", revenue: 8000 },
  { month: "Dec 2024", revenue: 8300 },
  { month: "Jan 2025", revenue: 7900 },
  { month: "Feb 2025", revenue: 8400 },
  { month: "Mar 2025", revenue: 8950 },
  { month: "Apr 2025", revenue: 9700 },
  { month: "May 2025", revenue: 11200 },
  { month: "Jun 2025", revenue: 9500 },
];

export const revenueChartConfig = {
  revenue: {
    label: "收入",
    color: "var(--chart-1)",
  },
} as ChartConfig;

export const leadsBySourceChartData = [
  { source: "website", leads: 170, fill: "var(--color-website)" },
  { source: "referral", leads: 105, fill: "var(--color-referral)" },
  { source: "social", leads: 90, fill: "var(--color-social)" },
  { source: "cold", leads: 62, fill: "var(--color-cold)" },
  { source: "other", leads: 48, fill: "var(--color-other)" },
];

export const leadsBySourceChartConfig = {
  leads: {
    label: "线索",
  },
  website: {
    label: "网站",
    color: "var(--chart-1)",
  },
  referral: {
    label: "推荐",
    color: "var(--chart-2)",
  },
  social: {
    label: "社交媒体",
    color: "var(--chart-3)",
  },
  cold: {
    label: "主动开发",
    color: "var(--chart-4)",
  },
  other: {
    label: "其他",
    color: "var(--chart-5)",
  },
} as ChartConfig;

export const projectRevenueChartData = [
  { name: "MVP Development", actual: 82000, target: 90000 },
  { name: "Consultation", actual: 48000, target: 65000 },
  { name: "Framer Sites", actual: 34000, target: 45000 },
  { name: "DevOps Support", actual: 77000, target: 90000 },
  { name: "LLM Training", actual: 68000, target: 80000 },
  { name: "Product Launch", actual: 52000, target: 70000 },
].map((row) => ({
  ...row,
  remaining: Math.max(0, row.target - row.actual),
}));

export const projectRevenueChartConfig = {
  actual: {
    label: "实际",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "剩余",
    color: "var(--chart-2)",
  },
  label: {
    color: "var(--primary-foreground)",
  },
} as ChartConfig;

export const salesPipelineChartData = [
  { stage: "线索", value: 680, fill: "var(--chart-1)" },
  { stage: "合格线索", value: 480, fill: "var(--chart-2)" },
  { stage: "已发送提案", value: 210, fill: "var(--chart-3)" },
  { stage: "谈判中", value: 120, fill: "var(--chart-4)" },
  { stage: "已中标", value: 45, fill: "var(--chart-5)" },
];

export const salesPipelineChartConfig = {
  value: {
    label: "线索",
    color: "var(--chart-1)",
  },
  stage: {
    label: "阶段",
  },
} as ChartConfig;

export const regionSalesData = [
  {
    region: "北美",
    sales: 37800,
    percentage: 31,
    growth: "-3.2%",
    isPositive: false,
  },
  {
    region: "欧洲",
    sales: 40100,
    percentage: 34,
    growth: "+9.4%",
    isPositive: true,
  },
  {
    region: "亚太地区",
    sales: 30950,
    percentage: 26,
    growth: "+12.8%",
    isPositive: true,
  },
  {
    region: "拉丁美洲",
    sales: 12200,
    percentage: 7,
    growth: "-1.7%",
    isPositive: false,
  },
  {
    region: "中东和非洲",
    sales: 2450,
    percentage: 2,
    growth: "+6.0%",
    isPositive: true,
  },
];

export const actionItems = [
  {
    id: 1,
    title: "发送启动文档",
    desc: "发送入职文档和时间表",
    due: "今天到期",
    priority: "高",
    priorityColor: "bg-red-100 text-red-700",
    checked: false,
  },
  {
    id: 2,
    title: "SaaS MVP演示通话",
    desc: "与客户预订Zoom会议",
    due: "明天到期",
    priority: "中",
    priorityColor: "bg-yellow-100 text-yellow-700",
    checked: true,
  },
  {
    id: 3,
    title: "更新案例研究",
    desc: "添加最新的LLM项目",
    due: "本周到期",
    priority: "低",
    priorityColor: "bg-green-100 text-green-700",
    checked: false,
  },
];

export const recentLeadsData = [
  {
    id: "L-1012",
    name: "Guillermo Rauch",
    company: "Vercel",
    status: "Qualified",
    source: "Website",
    lastActivity: "30m ago",
  },
  {
    id: "L-1018",
    name: "Nizzy",
    company: "Mail0",
    status: "Qualified",
    source: "Website",
    lastActivity: "35m ago",
  },
  {
    id: "L-1005",
    name: "Sahaj",
    company: "Tweakcn",
    status: "Negotiation",
    source: "Website",
    lastActivity: "1h ago",
  },
  {
    id: "L-1001",
    name: "Shadcn",
    company: "Shadcn/ui",
    status: "Qualified",
    source: "Website",
    lastActivity: "2h ago",
  },
  {
    id: "L-1003",
    name: "Sam Altman",
    company: "OpenAI",
    status: "Proposal Sent",
    source: "Social Media",
    lastActivity: "4h ago",
  },
  {
    id: "L-1008",
    name: "Michael Andreuzza",
    company: "Lexington Themes",
    status: "Contacted",
    source: "Social Media",
    lastActivity: "5h ago",
  },
  {
    id: "L-1016",
    name: "Skyleen",
    company: "Animate UI",
    status: "Proposal Sent",
    source: "Referral",
    lastActivity: "7h ago",
  },
  {
    id: "L-1007",
    name: "Arham Khan",
    company: "Weblabs Studio",
    status: "Won",
    source: "Website",
    lastActivity: "6h ago",
  },
  {
    id: "L-1011",
    name: "Sebastian Rindom",
    company: "Medusa",
    status: "Proposal Sent",
    source: "Referral",
    lastActivity: "10h ago",
  },
  {
    id: "L-1014",
    name: "Fred K. Schott",
    company: "Astro",
    status: "Contacted",
    source: "Social Media",
    lastActivity: "12h ago",
  },
  {
    id: "L-1010",
    name: "Peer Richelsen",
    company: "Cal.com",
    status: "New",
    source: "Other",
    lastActivity: "8h ago",
  },
  {
    id: "L-1002",
    name: "Ammar Khnz",
    company: "BE",
    status: "Contacted",
    source: "Referral",
    lastActivity: "1d ago",
  },
  {
    id: "L-1015",
    name: "Toby",
    company: "Shadcn UI Kit ",
    status: "Negotiation",
    source: "Other",
    lastActivity: "2d ago",
  },
  {
    id: "L-1006",
    name: "David Haz",
    company: "React Bits",
    status: "Qualified",
    source: "Referral",
    lastActivity: "2d ago",
  },
  {
    id: "L-1004",
    name: "Erşad",
    company: "Align UI",
    status: "New",
    source: "Cold Outreach",
    lastActivity: "3d ago",
  },
];

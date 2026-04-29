import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();

  // 如果用户已登录，重定向到仪表板
  if (session) {
    redirect("/dashboard/xueqiu-portfolio");
  }

  // 如果用户未登录，重定向到登录页
  redirect("/auth/v1/login");
}

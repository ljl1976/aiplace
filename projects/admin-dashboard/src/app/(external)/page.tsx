import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard/xueqiu-portfolio");
  return <>Coming Soon</>;
}

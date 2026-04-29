import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TestAuthPage() {
  const session = await getSession();

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>认证状态测试页面</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>当前会话状态:</h2>
        {session ? (
          <div style={{ color: 'green' }}>
            <p>✅ 已登录</p>
            <p>用户: {session.user.name}</p>
            <p>邮箱: {session.user.email}</p>
            <p>角色: {session.user.role}</p>
            <p>过期时间: {session.expires}</p>
          </div>
        ) : (
          <div style={{ color: 'red' }}>
            <p>❌ 未登录</p>
            <p>没有有效的会话信息</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>测试链接:</h2>
        <ul>
          <li><a href="/">访问根路径 (/)</a></li>
          <li><a href="/dashboard/default">访问仪表板 (/dashboard/default)</a></li>
          <li><a href="/auth/v1/login">访问登录页 (/auth/v1/login)</a></li>
          <li><a href="/api/auth/session">API: 检查会话</a></li>
        </ul>
      </div>

      <div>
        <h2>Cookie检查:</h2>
        <p>请打开浏览器开发者工具 (F12) → Application → Cookies → 检查是否有 <code>admin_session</code> cookie</p>
      </div>
    </div>
  );
}

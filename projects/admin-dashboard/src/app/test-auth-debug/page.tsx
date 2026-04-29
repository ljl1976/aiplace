"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function TestAuthDebugPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    // 测试session API
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSessionData(data))
      .catch(err => console.error('Session API error:', err));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>认证状态调试页面</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>AuthProvider 状态:</h2>
        <p>Loading: {isLoading ? '是' : '否'}</p>
        <p>Authenticated: {isAuthenticated ? '是' : '否'}</p>
        <p>User: {user ? JSON.stringify(user) : 'null'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Session API 返回:</h2>
        <pre>{JSON.stringify(sessionData, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Cookie 检查:</h2>
        <p>请打开浏览器开发者工具 (F12) → Application → Cookies → 检查是否有 <code>admin_session</code> cookie</p>
      </div>

      <div>
        <h2>测试链接:</h2>
        <ul>
          <li><a href="/dashboard/default">仪表板</a></li>
          <li><a href="/dashboard/service-management">服务管理</a></li>
          <li><a href="/auth/v1/login">登录页</a></li>
        </ul>
      </div>
    </div>
  );
}

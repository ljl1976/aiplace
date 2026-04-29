import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

// 飞书应用配置
const FEISHU_CONFIG = {
  appId: process.env.FEISHU_APP_ID || "",
  appSecret: process.env.FEISHU_APP_SECRET || "",
  baseUrl: "https://open.feishu.cn/open-apis",
};

// 获取飞书访问令牌
async function getTenantAccessToken(): Promise<string> {
  const response = await fetch(
    `${FEISHU_CONFIG.baseUrl}/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: FEISHU_CONFIG.appId,
        app_secret: FEISHU_CONFIG.appSecret,
      }),
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error("获取飞书访问令牌失败");
  }

  return data.tenant_access_token;
}

// 通过免登凭证获取用户信息
async function getUserInfo(ticket: string): Promise<any> {
  const token = await getTenantAccessToken();

  const response = await fetch(
    `${FEISHU_CONFIG.baseUrl}/authen/v1/user_info`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error("获取用户信息失败");
  }

  return data.data;
}

// 生成JWT Token
function generateToken(userId: string, email: string): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      userId,
      email,
      timestamp: Date.now(),
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
}

// GET - 处理飞书免登回调
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticket = searchParams.get("ticket");

    if (!ticket) {
      return NextResponse.json(
        { error: "缺少免登凭证" },
        { status: 400 }
      );
    }

    // 获取飞书用户信息
    const userInfo = await getUserInfo(ticket);

    // 验证用户权限（可选：检查用户邮箱是否在允许列表中）
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(userInfo.email)) {
      return NextResponse.json(
        { error: "用户无权限访问" },
        { status: 403 }
      );
    }

    // 创建用户会话
    const session = {
      user: {
        id: userInfo.user_id,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar_url || "",
        role: "administrator",
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await setSession(session);

    // 生成JWT Token（可选，用于后续API调用）
    const token = generateToken(userInfo.user_id, userInfo.email);

    // 重定向到管理后台
    return NextResponse.redirect(new URL("/dashboard/xueqiu-portfolio", request.url));
  } catch (error) {
    console.error("飞书免登错误:", error);
    return NextResponse.json(
      { error: "免登失败，请重试" },
      { status: 500 }
    );
  }
}

// POST - 验证JWT Token（可选，用于API调用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    return NextResponse.json({
      valid: true,
      user: decoded,
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: "Token无效" },
      { status: 401 }
    );
  }
}

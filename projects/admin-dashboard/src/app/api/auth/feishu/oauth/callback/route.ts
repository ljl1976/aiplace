import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

// 飞书OAuth配置
const FEISHU_OAUTH_CONFIG = {
  appId: process.env.FEISHU_APP_ID || "",
  appSecret: process.env.FEISHU_APP_SECRET || "",
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/feishu/oauth/callback`,
  tokenUrl: "https://open.feishu.cn/open-apis/authen/v3/oidc/access_token",
  userInfoUrl: "https://open.feishu.cn/open-apis/authen/v1/user_info",
};

// 获取访问令牌
async function getAccessToken(code: string): Promise<string> {
  const response = await fetch(FEISHU_OAUTH_CONFIG.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: FEISHU_OAUTH_CONFIG.appId,
      app_secret: FEISHU_OAUTH_CONFIG.appSecret,
      grant_type: "authorization_code",
      code: code,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error("获取访问令牌失败");
  }

  return data.data.access_token;
}

// 获取用户信息
async function getUserInfo(accessToken: string): Promise<any> {
  const response = await fetch(FEISHU_OAUTH_CONFIG.userInfoUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error("获取用户信息失败");
  }

  return data.data;
}

// GET - OAuth回调处理
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "缺少授权码" },
        { status: 400 }
      );
    }

    // 获取访问令牌
    const accessToken = await getAccessToken(code);

    // 获取用户信息
    const userInfo = await getUserInfo(accessToken);

    // 验证权限（可选）
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(userInfo.email)) {
      return NextResponse.json(
        { error: "用户无权限访问" },
        { status: 403 }
      );
    }

    // 创建会话
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

    // 重定向到管理后台
    return NextResponse.redirect(new URL("/dashboard/xueqiu-portfolio", request.url));
  } catch (error) {
    console.error("飞书OAuth回调错误:", error);
    return NextResponse.redirect(
      new URL("/auth/v1/login?error=feishu_oauth_failed", request.url)
    );
  }
}

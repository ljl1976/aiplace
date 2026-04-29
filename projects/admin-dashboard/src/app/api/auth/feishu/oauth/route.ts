import { NextRequest, NextResponse } from "next/server";
import { setSession } from "@/lib/auth";

// 飞书OAuth配置
const FEISHU_OAUTH_CONFIG = {
  appId: process.env.FEISHU_APP_ID || "",
  appSecret: process.env.FEISHU_APP_SECRET || "",
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/feishu/oauth/callback`,
  authUrl: "https://open.feishu.cn/open-apis/authen/v1/authorize",
  tokenUrl: "https://open.feishu.cn/open-apis/authen/v3/oidc/access_token",
  userInfoUrl: "https://open.feishu.cn/open-apis/authen/v1/user_info",
};

// GET - 发起OAuth授权
export async function GET(request: NextRequest) {
  const authUrl = new URL(FEISHU_OAUTH_CONFIG.authUrl);
  authUrl.searchParams.set("app_id", FEISHU_OAUTH_CONFIG.appId);
  authUrl.searchParams.set("redirect_uri", FEISHU_OAUTH_CONFIG.redirectUri);
  authUrl.searchParams.set("scope", "email contact user");
  authUrl.searchParams.set("state", Math.random().toString(36).substring(7));

  return NextResponse.redirect(authUrl.toString());
}

import { NextRequest, NextResponse } from "next/server";
import { createSession, setSession } from "@/lib/auth";
import { createHmac } from "crypto";

// 飞书应用自动登录
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const password = searchParams.get("password");
    const token = searchParams.get("token"); // 可选：使用token替代密码

    // 验证参数
    if (!email) {
      return NextResponse.json(
        { error: "缺少邮箱参数" },
        { status: 400 }
      );
    }

    // 验证邮箱是否在允许列表中
    const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
      return NextResponse.json(
        { error: "用户无权限访问" },
        { status: 403 }
      );
    }

    // 获取正确的重定向URL
    const redirectUrl = getRedirectUrl(request);

    // 方案1：使用token进行免登（推荐）
    if (token) {
      const isValidToken = validateAutoLoginToken(token, email);
      if (!isValidToken) {
        return NextResponse.json(
          { error: "Token无效或已过期" },
          { status: 401 }
        );
      }

      // 创建会话
      const session = await createAutoLoginSession(email);
      await setSession(session);

      // 重定向到管理后台
      return NextResponse.redirect(new URL("/dashboard/xueqiu-portfolio", redirectUrl));
    }

    // 方案2：使用密码进行免登
    if (password) {
      // 直接使用密码创建会话
      const session = await createSession(email, password);

      if (!session) {
        return NextResponse.json(
          { error: "邮箱或密码错误" },
          { status: 401 }
        );
      }

      await setSession(session);

      // 重定向到管理后台
      return NextResponse.redirect(new URL("/dashboard/xueqiu-portfolio", redirectUrl));
    }

    // 如果既没有token也没有密码，返回错误
    return NextResponse.json(
      { error: "缺少密码或token参数" },
      { status: 400 }
    );

  } catch (error) {
    console.error("自动登录错误:", error);
    return NextResponse.json(
      { error: "自动登录失败" },
      { status: 500 }
    );
  }
}

// 获取正确的重定向URL
function getRedirectUrl(request: NextRequest): string {
  // 优先使用环境变量配置的基础URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && appUrl !== "http://localhost:3000") {
    return appUrl;
  }

  // 否则从请求头中获取原始URL
  const host = request.headers.get("host") || "192.3.28.56:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";

  return `${protocol}://${host}`;
}

// 验证自动登录token
function validateAutoLoginToken(token: string, email: string): boolean {
  const expectedToken = generateAutoLoginToken(email);
  return token === expectedToken;
}

// 生成自动登录token
function generateAutoLoginToken(email: string): string {
  const SECRET_KEY = process.env.AUTO_LOGIN_SECRET || "your-secret-key";

  // 基于邮箱和当前小时数生成token（每小时变化）
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const data = `${email}_${currentHour}`;

  return createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex')
    .substring(0, 32);
}

// 创建自动登录会话
async function createAutoLoginSession(email: string): Promise<any> {
  // 从用户数据库中查找用户信息
  const { users } = await import("@/data/users");

  // 为简单起见，这里使用第一个用户作为模板
  const baseUser = users[0];

  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7天后过期

  return {
    user: {
      ...baseUser,
      email: email,
      name: extractNameFromEmail(email),
    },
    expires: expires.toISOString(),
  };
}

// 从邮箱提取用户名
function extractNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  // 将邮箱前缀转换为合适的用户名
  return localPart
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

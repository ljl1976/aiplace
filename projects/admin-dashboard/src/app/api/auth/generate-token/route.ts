import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// 生成自动登录token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "缺少邮箱参数" },
        { status: 400 }
      );
    }

    // 生成token
    const token = generateAutoLoginToken(email);

    return NextResponse.json({
      success: true,
      token,
      email,
      expiresIn: "1小时"
    });
  } catch (error) {
    console.error("生成Token错误:", error);
    return NextResponse.json(
      { error: "生成Token失败" },
      { status: 500 }
    );
  }
}

// 生成自动登录token
function generateAutoLoginToken(email: string): string {
  const SECRET_KEY = process.env.AUTO_LOGIN_SECRET || "your-secret-key-change-in-production";

  // 基于邮箱和当前小时数生成token
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const data = `${email}_${currentHour}`;

  return createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex')
    .substring(0, 32);
}

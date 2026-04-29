import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { createSession, setSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    // 创建会话
    const session = await createSession(email, password);

    if (!session) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 设置会话cookie
    await setSession(session);

    return NextResponse.json({
      success: true,
      user: session.user,
      redirect: "/dashboard/xueqiu-portfolio",
    });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "登录服务暂时不可用" },
      { status: 500 }
    );
  }
}

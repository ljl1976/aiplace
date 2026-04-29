import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 删除会话
    await deleteSession();

    return NextResponse.json({
      success: true,
      redirect: "/auth/v1/login",
    });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "登出服务暂时不可用" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await verifySession();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json(
      { error: "会话验证失败" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { restartService, stopService, startService } from "@/app/(main)/dashboard/service-management/_lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  try {
    // 检查认证和管理员权限
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (session.user.role !== "administrator") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { service } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !['restart', 'stop', 'start'].includes(action)) {
      return NextResponse.json({ error: "无效的操作" }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'restart':
        result = await restartService(service);
        break;
      case 'stop':
        result = await stopService(service);
        break;
      case 'start':
        result = await startService(service);
        break;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Service action API error:", error);
    return NextResponse.json(
      { error: "操作失败", details: error.message },
      { status: 500 }
    );
  }
}

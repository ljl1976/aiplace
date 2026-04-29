import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getServiceLogs, getServiceConfig } from "@/app/(main)/dashboard/service-management/_lib/api";

export async function GET(
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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let data;
    switch (type) {
      case "logs":
        data = await getServiceLogs(service);
        break;
      case "config":
        data = await getServiceConfig(service);
        break;
      default:
        return NextResponse.json({ error: "无效的请求类型" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Service info API error:", error);
    return NextResponse.json(
      { error: "获取服务信息失败", details: error.message },
      { status: 500 }
    );
  }
}

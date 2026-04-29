import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

const BASE_DIR = "/root/.openclaw/workspace";

function validatePath(requestedPath: string): string {
  const resolvedPath = path.resolve(BASE_DIR, requestedPath);
  if (!resolvedPath.startsWith(BASE_DIR)) {
    throw new Error("路径不合法");
  }
  return resolvedPath;
}

// GET - 读取文件内容
export async function GET(request: NextRequest) {
  try {
    // 检查认证和管理员权限
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (session.user.role !== "administrator") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const relativePath = searchParams.get("path");

    if (!relativePath) {
      return NextResponse.json({ error: "缺少文件路径" }, { status: 400 });
    }

    const targetPath = validatePath(relativePath);

    // 检查文件是否存在
    try {
      await fs.access(targetPath);
    } catch {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 读取文件内容
    const content = await fs.readFile(targetPath, "utf-8");

    return NextResponse.json({
      path: relativePath,
      content,
    });
  } catch (error) {
    console.error("读取文件失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "读取文件失败" },
      { status: 500 }
    );
  }
}

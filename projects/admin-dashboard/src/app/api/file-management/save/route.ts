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

// POST - 保存文件内容
export async function POST(request: NextRequest) {
  try {
    // 检查认证和管理员权限
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (session.user.role !== "administrator") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const body = await request.json();
    const { path: relativePath, content } = body;

    if (!relativePath || content === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const targetPath = validatePath(relativePath);

    // 验证文件类型
    const ext = path.extname(targetPath).toLowerCase();
    if (ext !== ".json" && ext !== ".md") {
      return NextResponse.json(
        { error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 对于JSON文件，验证格式
    if (ext === ".json") {
      try {
        JSON.parse(content);
      } catch {
        return NextResponse.json(
          { error: "JSON格式无效" },
          { status: 400 }
        );
      }
    }

    // 写入文件
    await fs.writeFile(targetPath, content, "utf-8");

    return NextResponse.json({
      success: true,
      message: "文件保存成功",
    });
  } catch (error) {
    console.error("保存文件失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存文件失败" },
      { status: 500 }
    );
  }
}

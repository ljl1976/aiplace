import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

// 允许访问的基础目录
const BASE_DIR = "/root/.openclaw/workspace";

// 需要忽略的目录
const IGNORE_DIRS = [
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".turbo",
];

// 验证路径安全性，防止目录遍历攻击
function validatePath(requestedPath: string): string {
  const resolvedPath = path.resolve(BASE_DIR, requestedPath);
  if (!resolvedPath.startsWith(BASE_DIR)) {
    throw new Error("路径不合法");
  }
  return resolvedPath;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// 递归扫描目录
async function scanDirectory(dir: string, relativePath: string = ""): Promise<any[]> {
  const files: any[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // 跳过隐藏文件和忽略的目录
      if (entry.name.startsWith(".")) continue;

      const fullPath = path.join(dir, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        // 跳过需要忽略的目录
        if (IGNORE_DIRS.includes(entry.name)) continue;

        // 递归扫描子目录
        const subFiles = await scanDirectory(fullPath, entryRelativePath);
        files.push(...subFiles);
      } else {
        const ext = path.extname(entry.name).toLowerCase().replace(".", "");
        if (ext !== "json" && ext !== "md") continue;

        const stats = await fs.stat(fullPath);

        files.push({
          name: entry.name,
          path: entryRelativePath,
          relativeDir: relativePath || "/",
          size: formatFileSize(stats.size),
          modified: stats.mtime,
          type: ext as "json" | "md",
        });
      }
    }
  } catch (error) {
    console.error(`扫描目录失败: ${dir}`, error);
  }

  return files;
}

// GET - 获取文件列表
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
    const relativePath = searchParams.get("path") || "";

    const targetDir = validatePath(relativePath);

    // 检查目录是否存在
    try {
      await fs.access(targetDir);
    } catch {
      return NextResponse.json({ error: "目录不存在" }, { status: 404 });
    }

    // 递归扫描目录
    const files = await scanDirectory(targetDir, relativePath);

    // 按修改时间降序排序
    files.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    return NextResponse.json(files);
  } catch (error) {
    console.error("获取文件列表失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取文件列表失败" },
      { status: 500 }
    );
  }
}

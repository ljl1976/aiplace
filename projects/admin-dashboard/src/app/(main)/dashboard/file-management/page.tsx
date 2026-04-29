"use client";

import { useState } from "react";
import { AdminCheck } from "@/app/(main)/dashboard/service-management/_components/admin-check";
import { FileListTable } from "./_components/file-list-table";
import { FileEditDialog } from "./_components/file-edit-dialog";
import type { FileItem } from "./_lib/types";

export default function FileManagementPage() {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEditFile = (file: FileItem) => {
    setSelectedFile(file);
    setShowEditDialog(true);
  };

  return (
    <AdminCheck>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">文件管理</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              浏览和编辑 /root/.openclaw/workspace/ 目录及其子目录中的 JSON 和 Markdown 文件
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <FileListTable onEditFile={handleEditFile} />
        </div>

        {/* 文件编辑对话框 */}
        <FileEditDialog
          file={selectedFile}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      </div>
    </AdminCheck>
  );
}

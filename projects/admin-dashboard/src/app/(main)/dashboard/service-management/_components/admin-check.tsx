"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function AdminCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "administrator") {
      router.push("/dashboard/default");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            需要登录才能访问此页面
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (user.role !== "administrator") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            需要管理员权限才能访问此页面
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

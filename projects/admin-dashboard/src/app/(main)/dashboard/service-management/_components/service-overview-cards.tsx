"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, HardDrive, Cpu, Server, Globe } from "lucide-react";
import type { ServiceOverview } from "../_lib/types";

export function ServiceOverviewCards() {
  const [overview, setOverview] = useState<ServiceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  async function fetchOverview() {
    try {
      const response = await fetch("/api/service-management?type=overview");
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error("Failed to fetch overview:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !overview) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 @3xl/main:grid-cols-5 @xl/main:grid-cols-3 @lg/main:grid-cols-2 grid-cols-1">
      <Card className="border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs @2xs/main:text-sm @xs/main:text-base font-medium text-green-700">运行中服务</CardTitle>
          <Server className="h-3 w-3 @2xs/main:h-4 @2xs/main:w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl @2xs/main:text-3xl font-bold text-green-600">{overview.runningServices}</div>
          <p className="text-xs @2xs/main:text-sm text-muted-foreground">
            总计 {overview.totalServices} 个服务
          </p>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs @2xs/main:text-sm @xs/main:text-base font-medium text-blue-700">Web服务</CardTitle>
          <Globe className="h-3 w-3 @2xs/main:h-4 @2xs/main:w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl @2xs/main:text-3xl font-bold text-blue-600">{overview.webServices || 0}</div>
          <p className="text-xs @2xs/main:text-sm text-muted-foreground">
            运行中的Web应用
          </p>
        </CardContent>
      </Card>

      <Card className="border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs @2xs/main:text-sm @xs/main:text-base font-medium text-purple-700">监听端口</CardTitle>
          <Activity className="h-3 w-3 @2xs/main:h-4 @2xs/main:w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl @2xs/main:text-3xl font-bold text-purple-600">{overview.listeningPorts}</div>
          <p className="text-xs @2xs/main:text-sm text-muted-foreground">活跃连接</p>
        </CardContent>
      </Card>

      <Card className="border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs @2xs/main:text-sm @xs/main:text-base font-medium text-orange-700">系统负载</CardTitle>
          <Cpu className="h-3 w-3 @2xs/main:h-4 @2xs/main:w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl @2xs/main:text-3xl font-bold text-orange-600">{overview.systemLoad.toFixed(2)}</div>
          <p className="text-xs @2xs/main:text-sm text-muted-foreground">1分钟平均负载</p>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs @2xs/main:text-sm @xs/main:text-base font-medium text-red-700">异常服务</CardTitle>
          <HardDrive className="h-3 w-3 @2xs/main:h-4 @2xs/main:w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl @2xs/main:text-3xl font-bold text-red-600">{overview.failedServices}</div>
          <p className="text-xs @2xs/main:text-sm text-muted-foreground">需要关注</p>
        </CardContent>
      </Card>
    </div>
  );
}

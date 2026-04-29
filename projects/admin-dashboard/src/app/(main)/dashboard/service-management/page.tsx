import { ServiceOverviewCards } from "./_components/service-overview-cards";
import { ServiceTable } from "./_components/system-services/service-table";
import { WebServiceTable } from "./_components/web-services/web-service-table";
import { AdminCheck } from "./_components/admin-check";

export default function ServiceManagementPage() {
  return (
    <AdminCheck>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">服务管理</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              监控和管理系统服务状态
            </p>
          </div>
        </div>

        <ServiceOverviewCards />

        <div className="grid gap-4 lg:grid-cols-1">
          <WebServiceTable />
        </div>

        <ServiceTable />

        {/* TODO: 添加更多功能组件 */}
        {/* <PortMonitoring /> */}
        {/* <ResourceMonitoring /> */}
      </div>
    </AdminCheck>
  );
}

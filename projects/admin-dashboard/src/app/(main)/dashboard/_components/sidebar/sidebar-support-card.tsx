import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SidebarSupportCard() {
  return (
    <Card size="sm" className="shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">寻找更多功能？</CardTitle>
        <CardDescription>提交问题或联系我。</CardDescription>
      </CardHeader>
    </Card>
  );
}

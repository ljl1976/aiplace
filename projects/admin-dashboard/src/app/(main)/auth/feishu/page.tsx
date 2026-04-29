"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket } from "lucide-react";

export default function FeishuLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 自动发起飞书免登
    initiateFeishuLogin();
  }, []);

  const initiateFeishuLogin = () => {
    // 检查是否在飞书应用内
    const isFeishuApp = /Feishu|Lark/i.test(navigator.userAgent);

    if (isFeishuApp) {
      // 飞书应用内免登
      if (window.webkit) {
        // iOS
        window.webkit.messageHandlers.FeishuAuth.postMessage({
          action: "getLoginTicket"
        });
      } else if (window.WebViewJavascriptBridge) {
        // Android
        window.WebViewJavascriptBridge.callHandler(
          "FeishuAuth",
          { action: "getLoginTicket" },
          (response: any) => {
            handleFeishuTicket(response.ticket);
          }
        );
      } else {
        // 通用方式：使用飞书JS SDK
        loadFeishuSDK();
      }
    } else {
      // 非飞书环境，显示提示
      console.log("请从飞书应用打开此页面");
    }
  };

  const loadFeishuSDK = () => {
    // 动态加载飞书JS SDK
    const script = document.createElement("script");
    script.src = "https://lf1-cdn-tos.bytegoofy.com/goofy/lark/op/h5-js-sdk-1.23.8.js";
    script.onload = () => {
      // @ts-ignore
      if (window.h5sdk) {
        // @ts-ignore
        window.h5sdk.ready(() => {
          // @ts-ignore
          window.h5sdk.auth({
            appId: process.env.NEXT_PUBLIC_FEISHU_APP_ID,
            onSuccess: (response: any) => {
              handleFeishuTicket(response.ticket);
            },
            onError: (error: any) => {
              console.error("飞书认证失败:", error);
            }
          });
        });
      }
    };
    document.head.appendChild(script);
  };

  const handleFeishuTicket = (ticket: string) => {
    // 将ticket发送到后端验证
    window.location.href = `/api/auth/feishu?ticket=${ticket}`;
  };

  const manualLogin = () => {
    router.push("/auth/v1/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">飞书免登录</CardTitle>
          <CardDescription>
            正在通过飞书应用自动登录...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>如果自动登录失败，请尝试：</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 text-left">
              <li>确保从飞书应用打开此页面</li>
              <li>检查网络连接</li>
              <li>联系管理员获取权限</li>
            </ol>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={manualLogin}
          >
            返回普通登录
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

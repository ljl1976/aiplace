"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export default function AutoLoginUrlGenerator() {
  const [email, setEmail] = useState("lijl@wzgroup.cn");
  const [password, setPassword] = useState("ljl19760924");
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://192.3.28.56:3000";

  // 方案1：密码方式
  const passwordUrl = `${baseUrl}/api/auth/auto-login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

  // 方案2：Token方式（需要后端生成）
  const [tokenUrl, setTokenUrl] = useState("");

  const generateTokenUrl = async () => {
    try {
      // 调用后端API生成token
      const response = await fetch("/api/auth/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokenUrl(`${baseUrl}/api/auth/auto-login?email=${encodeURIComponent(email)}&token=${data.token}`);
      } else {
        toast.error("生成Token失败");
      }
    } catch (error) {
      toast.error("生成Token失败");
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${type}已复制到剪贴板`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto pt-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              飞书免登录URL生成器
            </CardTitle>
            <CardDescription>
              生成用于飞书应用的自动登录链接
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">密码方式</TabsTrigger>
                <TabsTrigger value="token">Token方式（推荐）</TabsTrigger>
              </TabsList>

              <TabsContent value="password" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label>生成的URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={passwordUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(passwordUrl, "密码方式URL")}
                      size="icon"
                      variant="outline"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ⚠️ 注意：密码会在URL中明文显示，建议在HTTPS环境下使用
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-sm mb-2">使用说明：</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>复制上面的URL</li>
                    <li>在飞书应用的"快捷方式"或"机器人"中使用</li>
                    <li>用户点击链接后自动登录</li>
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="token" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token-email">邮箱</Label>
                  <Input
                    id="token-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>

                <Button onClick={generateTokenUrl} className="w-full">
                  生成Token URL
                </Button>

                {tokenUrl && (
                  <div className="space-y-2">
                    <Label>生成的URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tokenUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => copyToClipboard(tokenUrl, "Token方式URL")}
                        size="icon"
                        variant="outline"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✅ Token方式更安全，每小时自动更新
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm mb-2">Token方式优势：</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>不在URL中暴露密码</li>
                    <li>Token每小时自动更新，安全性更高</li>
                    <li>可以在飞书应用中长期使用</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-3">飞书应用配置示例：</h4>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
                  <code>{`1. 创建飞书快捷方式：
   - 名称：管理后台
   - 描述：点击直接进入管理后台
   - 链接：${passwordUrl}

2. 或者创建机器人：
   - 机器人名称：自动登录助手
   - 消息内容：点击下方链接进入管理后台
   - 链接按钮：管理后台`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

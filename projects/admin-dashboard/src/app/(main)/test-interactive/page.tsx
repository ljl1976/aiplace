"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TestInteractivePage() {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState<string>("");
  const [themeStatus, setThemeStatus] = useState<string>("未测试");

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    setLastClickTime(new Date().toLocaleTimeString('zh-CN'));
    console.log("按钮被点击了！", clickCount + 1);
  };

  const testTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme-mode');
    setThemeStatus(`当前主题: ${currentTheme}`);
    console.log("主题测试:", currentTheme);
  };

  const testZustand = () => {
    console.log("测试Zustand状态管理");
    // 这里可以添加更多状态管理测试
  };

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">交互功能测试页面</h1>
        <p className="text-muted-foreground">如果这个页面的按钮能正常工作，说明JavaScript基本功能正常</p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg space-y-2">
          <h2 className="text-lg font-semibold">基础按钮测试</h2>
          <p className="text-sm text-muted-foreground">点击次数: {clickCount}</p>
          <p className="text-sm text-muted-foreground">最后点击: {lastClickTime || "无"}</p>
          <Button onClick={handleClick}>
            点击测试按钮 (应该能看到点击次数增加)
          </Button>
        </div>

        <div className="p-4 border rounded-lg space-y-2">
          <h2 className="text-lg font-semibold">主题状态测试</h2>
          <p className="text-sm text-muted-foreground">{themeStatus}</p>
          <Button onClick={testTheme} variant="outline">
            测试主题状态
          </Button>
        </div>

        <div className="p-4 border rounded-lg space-y-2">
          <h2 className="text-lg font-semibold">浏览器控制台测试</h2>
          <p className="text-sm text-muted-foreground">
            按F12打开开发者工具，查看Console标签页，应该能看到"测试日志"
          </p>
          <Button onClick={testZustand} variant="secondary">
            发送测试日志
          </Button>
        </div>

        <div className="p-4 border rounded-lg space-y-2">
          <h2 className="text-lg font-semibold">当前页面信息</h2>
          <div className="text-sm space-y-1">
            <p>URL: {typeof window !== 'undefined' ? window.location.href : '服务器端渲染'}</p>
            <p>用户代理: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            <p>语言: {typeof navigator !== 'undefined' ? navigator.language : 'N/A'}</p>
            <p>Cookie启用: {typeof navigator !== 'undefined' ? navigator.cookieEnabled : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

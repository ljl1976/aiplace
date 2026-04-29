import Link from "next/link";

import { Command } from "lucide-react";

import { LoginForm } from "../../_components/login-form";
import { GoogleButton } from "../../_components/social-auth/google-button";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="mx-auto size-12 text-primary-foreground" />
            <div className="space-y-2">
              <h1 className="font-light text-5xl text-primary-foreground">欢迎回来</h1>
              <p className="text-primary-foreground/80 text-xl">登录以继续使用</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">登录</div>
            <div className="mx-auto max-w-xl text-muted-foreground">
              欢迎回来。请输入您的邮箱和密码，希望您还记得这次。
            </div>
          </div>
          <div className="space-y-4">
            <LoginForm />
            <GoogleButton className="w-full" variant="outline" />
            <p className="text-center text-muted-foreground text-xs">
              还没有账户？{" "}
              <Link prefetch={false} href="register" className="text-primary">
                注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 定义需要保护的路由
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/auth'];

export function middleware(request: NextRequest) {
  // 安全地获取pathname，如果未定义则返回空字符串
  const pathname = request.nextUrl?.pathname || request.url || '';

  // 如果pathname为空，直接放行
  if (!pathname) {
    return NextResponse.next();
  }

  // 检查admin_session或session cookie
  const sessionToken = request.cookies.get('admin_session')?.value || request.cookies.get('session')?.value;

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // 如果用户未登录且尝试访问受保护的路由，重定向到登录页面
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/auth/v1/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 如果用户已登录且尝试访问登录页面，重定向到仪表板
  if (isPublicRoute && sessionToken && pathname === '/auth/v1/login') {
    return NextResponse.redirect(new URL('/dashboard/xueqiu-portfolio', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api 路由
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon文件)
     * - public 文件夹中的文件
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

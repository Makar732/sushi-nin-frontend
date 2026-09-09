import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/api/admin/auth')
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('admin_token')?.value;
    const secret = process.env.ADMIN_JWT_SECRET || 'fallback_secret';

    if (!token || token !== secret) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
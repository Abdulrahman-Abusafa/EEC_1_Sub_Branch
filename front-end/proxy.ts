import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;

  // Protect all /admin routes except /admin/login
  if (currentPath.startsWith('/admin') && !currentPath.startsWith('/admin/login')) {
    const authCookie = request.cookies.get('admin_auth');

    if (!authCookie || authCookie.value !== 'authenticated') {
      // Redirect to login page if unauthenticated
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure the middleware is only applied to necessary paths
export const config = {
  matcher: ['/admin/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TokenPayload {
  id: string;
  name?: string;
  email?: string;
  role: 'passenger' | 'operator' | 'admin';
  exp?: number;
}


function parseJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const parsed = JSON.parse(jsonPayload);

    // Check expiration timestamp (exp is in seconds)
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Returns the default landing path for a given user role
 */
function getRoleDefaultPath(role?: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'operator':
      return '/operator/dashboard';
    case 'passenger':
    default:
      return '/customer/dashboard';
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Extract session token from cookies
  const tokenCookie = request.cookies.get('token')?.value;
  const betterAuthCookie = 
    request.cookies.get('better-auth.session_token')?.value || 
    request.cookies.get('__Secure-better-auth.session_token')?.value;

  let userPayload: TokenPayload | null = null;

  if (tokenCookie) {
    userPayload = parseJwtPayload(tokenCookie);
  }

  // Fallback for Better Auth session if present (defaults to passenger)
  if (!userPayload && betterAuthCookie) {
    userPayload = {
      id: 'oauth-user',
      role: 'passenger',
    };
  }

  const isAuthenticated = !!userPayload;
  const userRole = userPayload?.role || 'passenger';

  // 2. Define Route Categories
  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const isAdminRoute = pathname.startsWith('/admin');
  const isOperatorRoute = pathname.startsWith('/operator');
  const isCustomerRoute = pathname.startsWith('/customer');

  // --- RULE A: Authenticated Users Trying to Access /login or /register ---
  if (isAuthRoute && isAuthenticated) {
    const targetUrl = new URL(getRoleDefaultPath(userRole), request.url);
    return NextResponse.redirect(targetUrl);
  }

  // --- RULE B: Unauthenticated Users Accessing Protected Routes ---
  if (!isAuthenticated && (isAdminRoute || isOperatorRoute || isCustomerRoute)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- RULE C: Role-Based Access Control (RBAC) ---
  if (isAuthenticated) {
    if (isAdminRoute && userRole !== 'admin') {
      const redirectUrl = new URL(getRoleDefaultPath(userRole), request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (isOperatorRoute && userRole !== 'operator') {
      const redirectUrl = new URL(getRoleDefaultPath(userRole), request.url);
      return NextResponse.redirect(redirectUrl);
    }

    if (isCustomerRoute && userRole !== 'passenger') {
      const redirectUrl = new URL(getRoleDefaultPath(userRole), request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/admin/:path*',
    '/operator/:path*',
    '/customer/:path*',
  ],
};

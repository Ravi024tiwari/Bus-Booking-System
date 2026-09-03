import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // 1. Delete from cookieStore
    cookieStore.delete('token');
    cookieStore.delete('better-auth.session_token');
    cookieStore.delete('__Secure-better-auth.session_token');

    cookieStore.delete({ name: 'token', path: '/' });
    cookieStore.delete({ name: 'better-auth.session_token', path: '/' });
    cookieStore.delete({ name: '__Secure-better-auth.session_token', path: '/' });

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.'
    });

    // 2. Explicitly attach Set-Cookie header on the HTTP response with expired date & 0 maxAge
    const cookieNames = ['token', 'better-auth.session_token', '__Secure-better-auth.session_token'];
    cookieNames.forEach((cookieName) => {
      response.cookies.set({
        name: cookieName,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        maxAge: 0,
        path: '/'
      });
      response.cookies.delete(cookieName);
    });

    return response;

  } catch (err: any) {
    console.error('[Logout API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during logout.' },
      { status: 500 }
    );
  }
}

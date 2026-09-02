import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // 1. Delete from cookieStore
    cookieStore.delete('token');
    cookieStore.delete({
      name: 'token',
      path: '/',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.'
    });

    // 2. Explicitly attach Set-Cookie header on the HTTP response with expired date & 0 maxAge
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      maxAge: 0,
      path: '/'
    });

    // Extra safeguard: also delete via response.cookies helper
    response.cookies.delete('token');

    return response;

  } catch (err: any) {
    console.error('[Logout API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during logout.' },
      { status: 500 }
    );
  }
}

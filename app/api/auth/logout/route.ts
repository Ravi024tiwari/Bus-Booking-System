import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the secure cookie by setting its maxAge to 0
    cookieStore.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully.'
    });

  } catch (err: any) {
    console.error('[Logout API] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error during logout.' },
      { status: 500 }
    );
  }
}

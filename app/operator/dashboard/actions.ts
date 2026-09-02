'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function handleLogoutAction() {
  const cookieStore = await cookies();
  
  // Clear the secure cookie by setting its maxAge to 0 and deleting it explicitly
  cookieStore.delete('token');
  cookieStore.delete({
    name: 'token',
    path: '/',
  });
  
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
    maxAge: 0,
    path: '/'
  });

  redirect('/login');
}

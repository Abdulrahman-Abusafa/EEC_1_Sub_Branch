import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // The hardcoded credentials as requested by the user
    if (username === 'eeclub_student' && password === 'EEC@KFUPM') {
      const cookieStore = await cookies();
      
      // Set the authentication cookie.
      // We set it to expire in 24 hours.
      cookieStore.set('admin_auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid username or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Bad request' },
      { status: 400 }
    );
  }
}

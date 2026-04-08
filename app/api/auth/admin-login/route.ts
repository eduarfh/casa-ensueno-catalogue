// app/api/auth/admin-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const isValid = await validateCredentials(username, password);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Crear sesión simple con cookie
    const cookieStore = await cookies();
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    cookieStore.set('admin-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin-login] Error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

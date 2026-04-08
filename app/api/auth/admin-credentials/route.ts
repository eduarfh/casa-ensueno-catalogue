// app/api/auth/admin-credentials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateCredentials, getCurrentUsername } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const username = await getCurrentUsername();
    return NextResponse.json({ username });
  } catch (error) {
    console.error('[admin-credentials GET] Error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newUsername, newPassword } = body;

    if (!currentPassword || !newUsername || !newPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const result = await updateCredentials(currentPassword, newUsername, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Actualizar cookie con nuevo usuario
    const newSessionToken = Buffer.from(`${newUsername}:${Date.now()}`).toString('base64');
    cookieStore.set('admin-session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin-credentials POST] Error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

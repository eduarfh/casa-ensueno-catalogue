// app/api/auth/admin-logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin-session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin-logout] Error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

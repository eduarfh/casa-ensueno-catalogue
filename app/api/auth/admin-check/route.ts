// app/api/auth/admin-check/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    console.error('[admin-check] Error:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}

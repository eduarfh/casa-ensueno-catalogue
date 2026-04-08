// app/api/auth/init-credentials/route.ts
import { NextResponse } from 'next/server';
import { initializeCredentials } from '@/lib/admin-auth';

export async function POST() {
  try {
    const result = await initializeCredentials();

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Credenciales inicializadas correctamente'
    });
  } catch (error) {
    console.error('[init-credentials] Error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

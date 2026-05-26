// app/api/files/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const STORAGE_ROOT = process.env.STORAGE_PATH || '/app/storage';

// Mime types comunes
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
};

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? MIME_TYPES[ext] || 'application/octet-stream' : 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    if (!pathSegments || pathSegments.length === 0) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Construir path relativo
    const relativePath = pathSegments.join('/');
    
    // Prevenir path traversal
    if (relativePath.includes('..') || relativePath.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const filePath = join(STORAGE_ROOT, relativePath);

    // Verificar que el archivo existe
    try {
      const stats = await stat(filePath);
      if (!stats.isFile()) {
        return NextResponse.json({ error: 'Not a file' }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Leer archivo
    const fileBuffer = await readFile(filePath);
    const mimeType = getMimeType(relativePath);

    // Retornar archivo con headers apropiados
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[GET /api/files] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server"
import { query } from "@/lib/db"

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const v = bytes / Math.pow(k, i)
  return `${v.toFixed(2)} ${sizes[i]}`
}

export async function GET() {
  try {
    // Obtener todas las imágenes con sus tamaños desde la base de datos
    const result = await query('SELECT image_url, size FROM product_images');
    const rows = result.rows;

    // Sumar tamaños que ya están en la BD
    let usedBytes = 0;
    let filesWithSize = 0;
    let filesWithoutSize = 0;

    for (const row of rows) {
      if (row.size && Number.isFinite(row.size) && row.size > 0) {
        usedBytes += Number(row.size);
        filesWithSize++;
      } else {
        filesWithoutSize++;
      }
    }

    // Capacidad del volumen Railway (50GB)
    const capacityBytes = 50 * 1024 * 1024 * 1024; // 50 GB
    const percent = Math.min(100, (usedBytes / capacityBytes) * 100);

    return NextResponse.json({
      usedBytes,
      capacityBytes,
      usedFormatted: formatBytes(usedBytes),
      capacityFormatted: formatBytes(capacityBytes),
      percent: Number(percent.toFixed(2)),
      filesCount: rows.length,
      filesWithSize,
      filesWithoutSize,
      note: filesWithoutSize > 0 
        ? `${filesWithoutSize} archivos sin tamaño registrado. El tamaño real puede ser mayor.`
        : undefined
    })
  } catch (err: any) {
    console.error("Storage usage error:", err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

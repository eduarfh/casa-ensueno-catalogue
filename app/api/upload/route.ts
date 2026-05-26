// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { query } from "@/lib/db";
import { getStoragePublicUrl } from "@/lib/storage-utils";

const STORAGE_ROOT = process.env.STORAGE_PATH || '/app/storage';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") ? String(formData.get("productId")) : null;
    const displayOrderRaw = formData.get("display_order");
    const display_order = displayOrderRaw ? Number(displayOrderRaw) : 0;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Límite (opcional)
    const MAX_BYTES = 10 * 1024 * 1024; // 10MB
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Archivo demasiado grande", details: `Máximo ${Math.round(MAX_BYTES / (1024 * 1024))} MB` },
        { status: 413 },
      );
    }

    const originalName = file.name || "upload";
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const filename = `${timestamp}-${safeName}`;
    const relativePath = `products/${filename}`;

    // Crear directorio si no existe
    const productsDir = join(STORAGE_ROOT, 'products');
    try {
      await mkdir(productsDir, { recursive: true });
    } catch (err) {
      // Directorio ya existe, continuar
    }

    // Guardar archivo en el volumen
    const filePath = join(STORAGE_ROOT, relativePath);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    await writeFile(filePath, buffer);

    // Obtener URL pública
    const publicUrl = getStoragePublicUrl(relativePath);

    // Si nos pasan productId, insertar registro en product_images
    let productImage: any = null;
    if (productId) {
      try {
        const result = await query(
          'INSERT INTO product_images (product_id, image_url, display_order, size) VALUES ($1, $2, $3, $4) RETURNING *',
          [productId, relativePath, display_order, file.size]
        );
        productImage = result.rows[0];
      } catch (imgErr) {
        console.error("[upload] product_images insert error:", imgErr);
      }
    }

    return NextResponse.json(
      {
        url: publicUrl,
        path: relativePath,
        filename: originalName,
        size: file.size,
        type: file.type,
        productImage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[upload] Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: (error as Error).message ?? String(error) },
      { status: 500 }
    );
  }
}

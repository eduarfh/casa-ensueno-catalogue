// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { query, getClient } from "@/lib/db";
import { cookies } from "next/headers";
import { unlink } from "fs/promises";
import { getStorageFilePath } from "@/lib/storage-utils";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request: Request, context: { params: any }) {
  try {
    const { params } = context;
    const { id: productId } = (await params) as { id: string };

    if (!productId) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    // Verificar sesión de admin
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, description, price, available, category, images } = body ?? {};

    console.log("[products/:id/PUT] Received body:", JSON.stringify({ name, description, price, available, category, imagesCount: images?.length }));

    if (!name && description === undefined && price === undefined && available === undefined && category === undefined && images === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Preparar campos a actualizar
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 0;

    if (typeof name === "string") {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
    }
    
    if (typeof description === "string") {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(description);
    }
    
    if (price !== undefined && price !== null) {
      paramCount++;
      updateFields.push(`price = $${paramCount}`);
      updateValues.push(price);
    }
    
    if (available !== undefined && available !== null) {
      paramCount++;
      updateFields.push(`available = $${paramCount}`);
      updateValues.push(available);
    }

    if (category !== undefined) {
      const raw = String(category).trim();
      if (!raw) {
        return NextResponse.json({ error: "category cannot be empty" }, { status: 400 });
      }

      // Usar el nombre de categoría directamente (no hay tabla categories)
      paramCount++;
      updateFields.push(`category = $${paramCount}`);
      updateValues.push(raw);
    }

    // Manejo de imágenes
    if (images !== undefined) {
      console.log("[products/:id/PUT] Starting image update process");
      
      // Obtener imágenes existentes
      const existingResult = await query(
        'SELECT image_url FROM product_images WHERE product_id = $1',
        [productId]
      );
      const existingImages = existingResult.rows;

      console.log("[products/:id/PUT] Existing images:", existingImages.length);

      // Crear Set con nuevas imágenes
      const newImagePaths = new Set<string>();
      if (Array.isArray(images) && images.length) {
        for (const img of images) {
          if (!img) continue;
          if (typeof img === "string") {
            newImagePaths.add(img);
          } else if (img.path && typeof img.path === "string") {
            newImagePaths.add(img.path);
          }
        }
      }

      // Identificar imágenes a eliminar
      const imagesToDelete: string[] = [];
      for (const img of existingImages) {
        if (!newImagePaths.has(img.image_url)) {
          imagesToDelete.push(img.image_url);
        }
      }

      console.log("[products/:id/PUT] Images to delete:", imagesToDelete.length);

      // Eliminar archivos físicos del volumen
      for (const imagePath of imagesToDelete) {
        try {
          const filePath = getStorageFilePath(imagePath);
          await unlink(filePath);
          console.log("[products/:id/PUT] Deleted file:", filePath);
        } catch (err) {
          console.error("[products/:id/PUT] Error deleting file:", imagePath, err);
        }
      }

      // Eliminar registros de la BD
      await query('DELETE FROM product_images WHERE product_id = $1', [productId]);

      // Insertar nuevas imágenes
      if (Array.isArray(images) && images.length) {
        for (const img of images) {
          if (!img) continue;
          
          let imagePath: string;
          let displayOrder = 0;
          
          if (typeof img === "string") {
            imagePath = img;
          } else if (img.path && typeof img.path === "string") {
            imagePath = img.path;
            displayOrder = img.display_order ?? 0;
          } else {
            continue;
          }

          await query(
            'INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, $3)',
            [productId, imagePath, displayOrder]
          );
        }
      }
    }

    // Actualizar producto
    if (updateFields.length > 0) {
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(productId);
      
      const updateSQL = `UPDATE products SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`;
      await query(updateSQL, updateValues);
    }

    return NextResponse.json({ ok: true, productId }, { status: 200 });
  } catch (err: unknown) {
    console.error("[products/:id/PUT] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: any }) {
  try {
    const { params } = context;
    const { id: productId } = (await params) as { id: string };

    if (!productId) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    // Verificar sesión de admin
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener imágenes del producto
    const imagesResult = await query(
      'SELECT image_url FROM product_images WHERE product_id = $1',
      [productId]
    );
    const productImages = imagesResult.rows;

    console.log("[products/:id/DELETE] Deleting product with", productImages.length, "images");

    // Eliminar archivos físicos del volumen
    for (const img of productImages) {
      try {
        const filePath = getStorageFilePath(img.image_url);
        await unlink(filePath);
        console.log("[products/:id/DELETE] Deleted file:", filePath);
      } catch (err) {
        console.error("[products/:id/DELETE] Error deleting file:", img.image_url, err);
      }
    }

    // Usar transacción para eliminar registros
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      // Eliminar imágenes
      await client.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
      
      // Eliminar producto
      await client.query('DELETE FROM products WHERE id = $1', [productId]);
      
      await client.query('COMMIT');
      
      console.log("[products/:id/DELETE] Successfully deleted product:", productId);
      return NextResponse.json({ ok: true, productId }, { status: 200 });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    console.error("[products/:id/DELETE] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

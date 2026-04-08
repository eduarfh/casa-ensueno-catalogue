// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Nombre del bucket (con espacio)
const BUCKET = "casaensueno files";

export async function PUT(request: Request, context: { params: any }) {
  try {
    // IMPORTANT: await params because Next can pass it as a Promise
    const { params } = context;
    const { id: productId } = (await params) as { id: string };

    if (!productId) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    // Verificar sesión de admin usando cookies
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // leer body
    const body = await request.json().catch(() => ({}));
    const { name, description, price, available, category, images } = body ?? {};

    console.log("[products/:id/PUT] Received body:", JSON.stringify({ name, description, price, available, category, imagesCount: images?.length }));
    console.log("[products/:id/PUT] Images received:", JSON.stringify(images, null, 2));

    if (!name && description === undefined && price === undefined && available === undefined && category === undefined && images === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const admin = createAdminClient();

    // --- Manejo de category (como en tu code original) ---
    const updatePayload: Record<string, any> = {};
    if (typeof name === "string") updatePayload.name = name;
    if (typeof description === "string") updatePayload.description = description;
    if (price !== undefined && price !== null) updatePayload.price = price;
    if (available !== undefined && available !== null) updatePayload.available = available;

    if (category !== undefined) {
      const raw = String(category).trim();
      if (!raw) {
        return NextResponse.json({ error: "category cannot be empty" }, { status: 400 });
      }

      let resolvedName: string | null = null;

      if (uuidRegex.test(raw)) {
        const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id", raw).maybeSingle();
        if (fErr) {
          console.error("[products/:id/PUT] lookup category by uuid error:", fErr);
          return NextResponse.json({ error: "Error looking up category", details: fErr.message }, { status: 500 });
        }
        if (!found?.name) {
          return NextResponse.json({ error: "Category UUID not found" }, { status: 404 });
        }
        resolvedName = found.name;
      } else if (/^\d+$/.test(raw)) {
        const idInt = Number(raw);
        const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id_int", idInt).maybeSingle();
        if (fErr) {
          console.error("[products/:id/PUT] lookup category by id_int error:", fErr);
          return NextResponse.json({ error: "Error looking up category", details: fErr.message }, { status: 500 });
        }
        if (!found?.name) {
          return NextResponse.json({ error: `Category with id_int ${idInt} not found` }, { status: 404 });
        }
        resolvedName = found.name;
      } else {
        resolvedName = raw;
      }

      updatePayload.category = resolvedName;
    }

    // --- Si images viene en el body: reemplazar imágenes del producto ---
    if (images !== undefined) {
      console.log("[products/:id/PUT] ===== STARTING IMAGE UPDATE PROCESS =====");
      
      // Obtener las imágenes existentes antes de borrarlas
      const { data: existingImages, error: fetchErr } = await admin
        .from("product_images")
        .select("image_url")
        .eq("product_id", productId);

      if (fetchErr) {
        console.error("[products/:id/PUT] error fetching existing images:", fetchErr);
      }

      console.log("[products/:id/PUT] Existing images from DB:", JSON.stringify(existingImages, null, 2));

      // Crear un Set con las nuevas imágenes (paths) para comparar
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

      console.log("[products/:id/PUT] New image paths:", Array.from(newImagePaths));

      // Identificar imágenes a eliminar del storage
      const imagesToDelete: string[] = [];
      if (existingImages && Array.isArray(existingImages)) {
        for (const img of existingImages) {
          const imagePath = img.image_url;
          
          // Si la imagen existente no está en las nuevas, marcarla para eliminar
          if (!newImagePaths.has(imagePath)) {
            console.log("[products/:id/PUT] Image marked for deletion:", imagePath);
            imagesToDelete.push(imagePath);
          }
        }
      }

      console.log("[products/:id/PUT] Total images to delete:", imagesToDelete.length);

      // Eliminar imágenes del storage
      if (imagesToDelete.length > 0) {
        console.log("[products/:id/PUT] Deleting images from storage:", imagesToDelete);
        const { data: deleteData, error: storageErr } = await admin.storage
          .from(BUCKET)
          .remove(imagesToDelete);

        if (storageErr) {
          console.error("[products/:id/PUT] error deleting images from storage:", storageErr);
        } else {
          console.log("[products/:id/PUT] Successfully deleted images from storage. Response:", deleteData);
        }
      }

      // Borrar registros de product_images de la base de datos
      const { error: delErr } = await admin.from("product_images").delete().eq("product_id", productId);
      if (delErr) {
        console.error("[products/:id/PUT] error deleting existing product_images:", delErr);
      }

      // Insertar nuevas imágenes
      if (Array.isArray(images) && images.length) {
        const imageRecords: { product_id: string; image_url: string; display_order?: number }[] = [];

        for (const img of images) {
          if (!img) continue;
          if (typeof img === "string") {
            imageRecords.push({ product_id: productId, image_url: img, display_order: 0 });
          } else if (img.path && typeof img.path === "string") {
            imageRecords.push({ product_id: productId, image_url: img.path, display_order: img.display_order ?? 0 });
          }
        }

        if (imageRecords.length) {
          const { error: insErr } = await admin.from("product_images").insert(imageRecords);
          if (insErr) {
            console.error("[products/:id/PUT] insert images error:", insErr);
            return NextResponse.json({ error: "Error inserting images", details: insErr.message }, { status: 500 });
          }
        }
      }
    }

    // --- Actualizar otros campos ---
    if (Object.keys(updatePayload).length > 0) {
      const { error: updErr } = await admin.from("products").update(updatePayload).eq("id", productId);
      if (updErr) {
        console.error("[products/:id/PUT] update product error:", updErr);
        return NextResponse.json({ error: "Error updating product", details: updErr.message }, { status: 500 });
      }
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
    // IMPORTANT: await params because Next can pass it as a Promise
    const { params } = context;
    const { id: productId } = (await params) as { id: string };

    if (!productId) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    // Verificar sesión de admin usando cookies
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Obtener las imágenes del producto antes de eliminarlo
    const { data: productImages, error: fetchImagesErr } = await admin
      .from("product_images")
      .select("image_url")
      .eq("product_id", productId);

    if (fetchImagesErr) {
      console.error("[products/:id/DELETE] error fetching product images:", fetchImagesErr);
    }

    // Eliminar imágenes del storage
    if (productImages && Array.isArray(productImages) && productImages.length > 0) {
      const imagePaths = productImages.map(img => img.image_url).filter(Boolean);
      
      if (imagePaths.length > 0) {
        console.log("[products/:id/DELETE] Deleting images from storage:", imagePaths);
        const { error: storageErr } = await admin.storage
          .from(BUCKET)
          .remove(imagePaths);

        if (storageErr) {
          console.error("[products/:id/DELETE] error deleting images from storage:", storageErr);
          // No abortamos, continuamos con la eliminación del producto
        } else {
          console.log("[products/:id/DELETE] Successfully deleted images from storage");
        }
      }
    }

    // Eliminar registros de product_images
    const { error: delImagesErr } = await admin.from("product_images").delete().eq("product_id", productId);
    if (delImagesErr) {
      console.error("[products/:id/DELETE] error deleting product_images records:", delImagesErr);
      return NextResponse.json({ error: "Error deleting product images", details: delImagesErr.message }, { status: 500 });
    }

    // Eliminar el producto
    const { error: delProductErr } = await admin.from("products").delete().eq("id", productId);
    if (delProductErr) {
      console.error("[products/:id/DELETE] error deleting product:", delProductErr);
      return NextResponse.json({ error: "Error deleting product", details: delProductErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, productId }, { status: 200 });
  } catch (err: unknown) {
    console.error("[products/:id/DELETE] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

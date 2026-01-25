// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") ? String(formData.get("productId")) : null;
    const displayOrderRaw = formData.get("display_order");
    const display_order = displayOrderRaw ? Number(displayOrderRaw) : 0;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Límite (opcional)
    const MAX_BYTES = 2 * 1024 * 1024; // 2MB, ajusta si quieres
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Archivo demasiado grande", details: `Máximo ${Math.round(MAX_BYTES / 1024)} KB` },
        { status: 413 },
      );
    }

    
    const BUCKET = "casaensueno files";
    const admin = createAdminClient();

    const originalName = file.name || "upload";
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const filename = `${timestamp}-${safeName}`;
    const path = `products/${filename}`;

    // ArrayBuffer -> Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload] supabase storage error:", uploadError);
      return NextResponse.json({ error: "Upload failed", details: uploadError.message || uploadError }, { status: 500 });
    }

    // Obtener public URL si bucket es público (mejor) o signed URL (fallback)
    let publicUrl: string | null = null;
    try {
      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
      publicUrl = pub?.publicUrl ?? null;
    } catch (e) {
      console.warn("[upload] getPublicUrl failed:", e);
    }

    if (!publicUrl) {
      try {
        const { data: signed, error: signedErr } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
        if (!signedErr && signed?.signedUrl) publicUrl = signed.signedUrl;
      } catch (e) {
        console.warn("[upload] createSignedUrl failed:", e);
      }
    }

    // Si nos pasan productId, insertar registro en product_images (guardamos path en image_url)
    let productImage: any = null;
    if (productId) {
      const { error: imgErr, data: imgData } = await admin
        .from("product_images")
        .insert([{ product_id: productId, image_url: path, display_order }])
        .select()
        .single();
      if (imgErr) {
        console.error("[upload] product_images insert error:", imgErr);
      } else {
        productImage = imgData;
      }
    }

    return NextResponse.json(
      {
        url: publicUrl,
        path,
        filename: originalName,
        size: file.size,
        type: file.type,
        upload: uploadData ?? null,
        productImage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[upload] Upload error:", error);
    return NextResponse.json({ error: "Upload failed", details: (error as Error).message ?? String(error) }, { status: 500 });
  }
}

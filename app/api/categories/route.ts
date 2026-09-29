// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * GET /api/categories
 * Obtiene todas las categorías únicas con el conteo de productos
 */
export async function GET() {
  try {
    const result = await query(
      `
      SELECT 
        category as name,
        COUNT(*) as count
      FROM products
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY category ASC
      `,
      []
    );

    const categories = result.rows.map(row => ({
      name: row.name,
      count: parseInt(row.count || "0")
    }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("[GET /api/categories] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Crea una nueva categoría (solo admin)
 * Nota: Las categorías se crean implícitamente cuando se asignan a productos,
 * este endpoint es opcional pero útil para pre-crear categorías
 */
export async function POST(request: Request) {
  try {
    // Verificar sesión de admin
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre de la categoría es requerido" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Verificar si ya existe
    const existingResult = await query(
      `SELECT COUNT(*) as count FROM products WHERE LOWER(category) = LOWER($1)`,
      [trimmedName]
    );

    if (parseInt(existingResult.rows[0]?.count || "0") > 0) {
      return NextResponse.json(
        { error: "Ya existe una categoría con ese nombre" },
        { status: 409 }
      );
    }

    // Las categorías no se almacenan en una tabla separada,
    // simplemente confirmamos que se puede usar
    return NextResponse.json(
      { 
        message: "Categoría lista para usar",
        category: { name: trimmedName, count: 0 }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/categories] Error:", error);
    return NextResponse.json(
      { error: "Error al crear categoría", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories
 * Renombra una categoría en todos los productos que la usan
 */
export async function PUT(request: Request) {
  try {
    // Verificar sesión de admin
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { oldName, newName } = body;

    if (!oldName || !newName || typeof oldName !== "string" || typeof newName !== "string") {
      return NextResponse.json(
        { error: "Se requieren oldName y newName" },
        { status: 400 }
      );
    }

    const trimmedOldName = oldName.trim();
    const trimmedNewName = newName.trim();

    if (!trimmedOldName || !trimmedNewName) {
      return NextResponse.json(
        { error: "Los nombres no pueden estar vacíos" },
        { status: 400 }
      );
    }

    // Verificar que la categoría antigua existe
    const checkResult = await query(
      `SELECT COUNT(*) as count FROM products WHERE category = $1`,
      [trimmedOldName]
    );

    const count = parseInt(checkResult.rows[0]?.count || "0");
    
    if (count === 0) {
      return NextResponse.json(
        { error: "La categoría no existe o no tiene productos asociados" },
        { status: 404 }
      );
    }

    // Actualizar todos los productos con esta categoría
    const result = await query(
      `UPDATE products SET category = $1, updated_at = NOW() WHERE category = $2`,
      [trimmedNewName, trimmedOldName]
    );

    return NextResponse.json({
      message: "Categoría actualizada correctamente",
      updatedCount: result.rowCount || 0
    });
  } catch (error: any) {
    console.error("[PUT /api/categories] Error:", error);
    return NextResponse.json(
      { error: "Error al actualizar categoría", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories?name=xxx
 * Elimina una categoría (establece category como NULL en productos)
 */
export async function DELETE(request: Request) {
  try {
    // Verificar sesión de admin
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Se requiere el nombre de la categoría" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    // Establecer category como NULL en todos los productos con esta categoría
    const result = await query(
      `UPDATE products SET category = NULL, updated_at = NOW() WHERE category = $1`,
      [trimmedName]
    );

    const deletedCount = result.rowCount || 0;

    return NextResponse.json({
      message: deletedCount > 0 
        ? `Categoría eliminada de ${deletedCount} producto${deletedCount !== 1 ? 's' : ''}`
        : "Categoría eliminada (no había productos asociados)",
      deletedCount
    });
  } catch (error: any) {
    console.error("[DELETE /api/categories] Error:", error);
    return NextResponse.json(
      { error: "Error al eliminar categoría", details: error?.message },
      { status: 500 }
    );
  }
}

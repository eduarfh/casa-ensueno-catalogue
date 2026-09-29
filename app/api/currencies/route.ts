// app/api/currencies/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/currencies
 * Obtiene todas las monedas activas
 */
export async function GET() {
  try {
    const result = await query(
      `
      SELECT id, code, symbol, name, is_active, display_order
      FROM currencies
      WHERE is_active = true
      ORDER BY display_order ASC, name ASC
      `,
      []
    );

    return NextResponse.json({ currencies: result.rows });
  } catch (error: any) {
    console.error("[GET /api/currencies] Error:", error);
    return NextResponse.json(
      { error: "Error al obtener monedas", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/currencies
 * Crea una nueva moneda (solo admin)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, symbol, name, is_active = true, display_order = 0 } = body;

    if (!code || !symbol || !name) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: code, symbol, name" },
        { status: 400 }
      );
    }

    const result = await query(
      `
      INSERT INTO currencies (code, symbol, name, is_active, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [code.toUpperCase(), symbol, name, is_active, display_order]
    );

    return NextResponse.json({ currency: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/currencies] Error:", error);
    
    // Manejar error de código duplicado
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe una moneda con ese código" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear moneda", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/currencies
 * Actualiza una moneda existente
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, symbol, name, is_active, display_order } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID de la moneda" },
        { status: 400 }
      );
    }

    const result = await query(
      `
      UPDATE currencies
      SET code = COALESCE($2, code),
          symbol = COALESCE($3, symbol),
          name = COALESCE($4, name),
          is_active = COALESCE($5, is_active),
          display_order = COALESCE($6, display_order),
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, code?.toUpperCase(), symbol, name, is_active, display_order]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Moneda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ currency: result.rows[0] });
  } catch (error: any) {
    console.error("[PUT /api/currencies] Error:", error);
    return NextResponse.json(
      { error: "Error al actualizar moneda", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/currencies?id=xxx
 * Elimina una moneda (solo si no tiene productos asociados)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID de la moneda" },
        { status: 400 }
      );
    }

    // Verificar si hay productos usando esta moneda
    const checkResult = await query(
      `SELECT COUNT(*) as count FROM product_currencies WHERE currency_id = $1`,
      [id]
    );

    if (parseInt(checkResult.rows[0]?.count || "0") > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una moneda que tiene productos asociados" },
        { status: 409 }
      );
    }

    const result = await query(
      `DELETE FROM currencies WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Moneda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Moneda eliminada correctamente" });
  } catch (error: any) {
    console.error("[DELETE /api/currencies] Error:", error);
    return NextResponse.json(
      { error: "Error al eliminar moneda", details: error?.message },
      { status: 500 }
    );
  }
}

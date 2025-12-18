// app/catalog/page.tsx
import React, { Suspense } from "react";
import SiteHeader from "@/components/site-header";
import { createServerClient } from "@/lib/supabase/server";
import CatalogShell from "@/components/catalog-shell";

export default async function CatalogPage() {
  const supabase = await createServerClient();

  // Traemos categorías (id, id_int y name)
  const { data: categoriesRaw, error } = await supabase
    .from("categories")
    .select("id, id_int, name")
    .order("name");

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Error consultando categorías</h1>
          <pre className="whitespace-pre-wrap bg-red-50 p-4 rounded">{JSON.stringify(error, null, 2)}</pre>
        </main>
      </div>
    );
  }

  // Mapear y enviar uuid + id_int (si existe) para que el cliente pueda resolver categorías por UUID
  const categories = (categoriesRaw || []).map((c: any) => ({
    uuid: String(c.id),
    id_int: typeof c.id_int === "number" ? c.id_int : null,
    id: String(c.id_int ?? c.id), // id usado por la UI (prefiere id_int)
    name: c.name,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Catálogo de Productos</h1>

        {/* Suspense para el CatalogShell (cliente) */}
        <Suspense fallback={<div className="text-muted-foreground">Cargando catálogo…</div>}>
          <CatalogShell categories={categories} />
        </Suspense>
      </main>
    </div>
  );
}

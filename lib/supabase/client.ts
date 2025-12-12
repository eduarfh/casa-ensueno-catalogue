// lib/supabase/client.ts
"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente singleton para uso en el navegador.
 * Importar y usar solo desde componentes client-side.
 */
let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createBrowserSupabase() {
  if (typeof window === "undefined") return null;
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    console.warn("[Supabase][client] NEXT_PUBLIC_SUPABASE_* env vars not set");
    return null;
  }

  browserClient = createSupabaseClient(url, anon);
  return browserClient;
}

// alias histórico / compatibilidad
export const createBrowserClient = createBrowserSupabase;
export const createClient = createBrowserSupabase;

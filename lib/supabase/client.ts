// lib/supabase/client.ts
"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

declare global {
  // extend globalThis para TypeScript
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __supabase_browser_client: any;
}

let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createBrowserSupabase() {
  if (typeof window === "undefined") return null;

  // si ya existe en global (HMR safe), reutilizamos
  if ((globalThis as any).__supabase_browser_client) {
    return (globalThis as any).__supabase_browser_client;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    console.warn("[Supabase][client] NEXT_PUBLIC_SUPABASE_* env vars not set");
    return null;
  }

  // IMPORTANTE: persistSession/autoRefreshToken deshabilitados (SSR cookie flow).
  const client = createSupabaseClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // guardamos en globalThis para evitar múltiples instancias durante HMR
  (globalThis as any).__supabase_browser_client = client;
  return client;
}

export const createBrowserClient = createBrowserSupabase;
export const createClient = createBrowserSupabase;

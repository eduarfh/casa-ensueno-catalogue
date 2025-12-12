// lib/supabase/client.ts
"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

  // IMPORTANTE: desactivamos persistSession/autoRefreshToken porque el servidor
  // ya gestiona sesión por cookies (SSR flow). Esto evita doble-rotación.
  browserClient = createSupabaseClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return browserClient;
}

export const createBrowserClient = createBrowserSupabase;
export const createClient = createBrowserSupabase;

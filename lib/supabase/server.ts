// lib/supabase/server.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * createServerSupabase({ allowSetCookies })
 *
 * - allowSetCookies: si true usamos el helper SSR (createServerClient) y permitimos
 *   que la librería escriba cookies (route handlers).
 * - Si allowSetCookies === false (por defecto) devolvemos un cliente "normal"
 *   con persistSession/autoRefreshToken DESACTIVADOS para evitar que el cliente
 *   intente refresh en Server Components.
 */
export async function createServerSupabase({ allowSetCookies = false } = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    console.warn("[Supabase][server] NEXT_PUBLIC_SUPABASE_* env vars not set");
    // Fallback minimal stub para evitar romper código que llama .from(...)
    return {
      from: (_: string) => ({
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
      }),
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    } as any;
  }

  if (!allowSetCookies) {
    // Modo lectura en Server Components: cliente normal sin persist/autorefresh
    return createSupabaseClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  // allowSetCookies === true -> usar helper SSR que sí maneja cookies del request
  try {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");

    // cookies() puede ser sync o async en distintas versiones, await cubre ambos casos
    const cookieStore = (await cookies()) as any;

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          try {
            return (cookieStore?.getAll?.() ?? []) as any[];
          } catch (err) {
            console.warn("[Supabase][server] cookieStore.getAll() failed:", err);
            return [];
          }
        },
        setAll(cookiesToSet: any) {
          try {
            const safeSummary = (cookiesToSet || []).map((c: any) => {
              const val = String(c?.value ?? "");
              return { name: c?.name, valueLen: val.length, options: c?.options ?? {} };
            });
            console.log("[Supabase][server] setAll cookies requested:", safeSummary);

            if (!cookieStore || typeof cookieStore.set !== "function") {
              console.warn("[Supabase][server] cookieStore.set not available, cannot persist cookies");
              return;
            }

            cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options));
          } catch (err) {
            console.warn("[Supabase][server] failed to set cookies (readonly?, unexpected):", err);
          }
        },
      },
      // En route handlers queremos el comportamiento por defecto (persistSession true)
    });

    return supabase;
  } catch (err) {
    console.warn("[Supabase][server] failed to init SSR helper, falling back to basic client:", err);
    // fallback a cliente normal (sin persist/autorefresh) por seguridad
    return createSupabaseClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
}

// Alias antiguo para compatibilidad
export const createServerClient = createServerSupabase;

// Cliente público simple (no muta cookies)
export function createPublicServerClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

// lib/supabase/server.ts
/**
 * Server-side helper para Supabase.
 *
 * - createServerClient(): cliente que intenta usar @supabase/ssr y respeta cookies (ideal para rutas que dependen de sesión).
 * - createPublicServerClient(): cliente "público" que NO usa next/headers y no lee cookies (ideal para metadata / páginas públicas).
 *
 * En el fallback usamos createSupabaseClient (anon key) para mantener la API encadenable.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let serverClient: any = null;

export async function createServerSupabase() {
  if (serverClient) return serverClient;

  try {
    // Intentamos usar @supabase/ssr (respeta cookies)
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");

    const cookieStore = await cookies();

    serverClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // entornos donde la cookie store sea readonly
            }
          },
        },
      },
    );
  } catch (error) {
    // Si no está @supabase/ssr (build env), crear un cliente estándar para preservar API encadenable
    console.warn("[Supabase][server] SSR helper not available, using standard supabase client as fallback", error);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      // si no hay env, devolvemos un stub encadenable que resuelve con data:[] para no romper builds
      const stubQuery = () => ({
        select: () => ({
          eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          ilike: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      });

      serverClient = {
        from: (/*table*/: string) => stubQuery(),
        auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      } as any;
    } else {
      serverClient = createSupabaseClient(url, anon);
    }
  }

  return serverClient;
}

// Export canónico para server-side usage
export const createServerClient = createServerSupabase;

/* -------------------------
   Cliente público: no usa next/headers (no lee cookies).
   Útil para metadata y páginas públicas que queremos prerenderizar.
--------------------------*/
export function createPublicServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    console.warn("[Supabase][public] NEXT_PUBLIC_SUPABASE_* env vars not set");
    // devolver stub encadenable
    return {
      from: () => ({
        select: () => ({
          eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          ilike: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    } as any;
  }

  return createSupabaseClient(url, anon);
}

// lib/supabase/server.ts
/**
 * Server-side helper. Intenta usar @supabase/ssr (si está disponible)
 * para respetar cookies de sesión en SSR; si no está disponible, devuelve un fallback.
 *
 * Además exportamos createPublicServerClient para lecturas públicas (no usa cookies)
 * — útil para metadata o páginas públicas donde no necesitamos la cookie/session.
 */

let serverClient: any = null;

export async function createServerSupabase() {
  if (serverClient) return serverClient;

  try {
    // @supabase/ssr proporciona createServerClient que respeta cookies en Next server.
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
              // entornos donde la store sea readonly
            }
          },
        },
      },
    );
  } catch (error) {
    // Fallback (útil para build o entornos donde no exista @supabase/ssr)
    // Mostramos aviso y devolvemos un cliente mínimo para que no rompa imports en build.
    console.warn("[Supabase][server] SSR helper not available, using fallback client", error);
    serverClient = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
          ilike: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    };
  }

  return serverClient;
}

// Export canónico para uso en server-side code (routes, pages server components, etc.)
export const createServerClient = createServerSupabase;

/* -------------------------
   Helper adicional: cliente "público" que NO usa next/headers cookies.
   Ideal para páginas públicas (ej. metadata) donde NO se necesita la cookie/session.
   Esto permite que Next prerenderice esas páginas sin marcar uso de cookies.
--------------------------*/
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createPublicServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    console.warn("[Supabase][public] NEXT_PUBLIC_SUPABASE_* env vars not set");
    // devolver objeto mínimo para no romper builds en entornos sin env
    return {
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }),
      }),
    } as any;
  }

  // crear un cliente supabase estándar (sin wiring de cookies)
  return createSupabaseClient(url, anon);
}

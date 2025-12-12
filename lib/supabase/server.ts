// lib/supabase/server.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function createServerSupabase() {
  // NOTA: no guardamos el cliente en un singleton a nivel módulo en entornos serverless,
  // porque las instancias pueden persistir y mezclar cookies entre requests.
  try {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // lee las cookies desde next/headers
          getAll() {
            try {
              return cookieStore.getAll();
            } catch (err) {
              console.warn("[Supabase][server] cookieStore.getAll() failed:", err);
              return [];
            }
          },

          // intenta escribir, pero no tragues el error: loguea para debug
          setAll(cookiesToSet: any) {
            try {
              // NO loguees valores de tokens! solo nombres/longitudes para debug seguro
              const safeSummary = cookiesToSet.map((c: any) => {
                const val = String(c?.value ?? "");
                return { name: c?.name, valueLen: val.length, options: c?.options ?? {} };
              });
              console.log("[Supabase][server] setAll cookies requested:", safeSummary);

              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options),
              );
            } catch (err) {
              // Logamos el error para que lo veas en Vercel -> Deployments -> Logs
              console.warn("[Supabase][server] failed to set cookies (readonly?), will not persist session:", err);
            }
          },
        },
      },
    );

    return supabase;
  } catch (error) {
    console.warn("[Supabase][server] SSR helper not available, using standard supabase client as fallback", error);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      // stub (same que antes)
      const stubQuery = () => ({
        select: () => ({
          eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          ilike: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      });

      return {
        from: (_table: string) => stubQuery(),
        auth: { getUser: async () => ({ data: { user: null }, error: null }) },
      } as any;
    } else {
      return createSupabaseClient(url, anon);
    }
  }
}

export const createServerClient = createServerSupabase;

/* -------------------------
   Cliente público: no usa next/headers (no lee cookies).
--------------------------*/
export function createPublicServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anon) {
    console.warn("[Supabase][public] NEXT_PUBLIC_SUPABASE_* env vars not set");
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

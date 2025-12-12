// lib/supabase/server.ts
/**
 * Server-side helper. Intenta usar @supabase/ssr (si está disponible)
 * para respetar cookies de sesión en SSR; si no está disponible, devuelve un fallback.
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

// Export canónico para uso en server-side code (routes, pages server components, generateMetadata...)
export const createServerClient = createServerSupabase;

// NOTA (intencional): no exportamos "createClient" desde aquí para evitar confundir server/client.
// Si necesitas un alias por compatibilidad, házmelo saber y lo añadimos explícitamente.

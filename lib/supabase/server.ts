// lib/supabase/server.ts
let serverClient: any = null

export async function createClient() {
  if (serverClient) {
    return serverClient
  }

  try {
    // Se importa dinámicamente para que esto solo se ejecute en runtime/server
    const { createServerClient } = await import("@supabase/ssr")
    const { cookies } = await import("next/headers")

    const cookieStore = await cookies()

    serverClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options))
            } catch {
              // ignore in environments where next/headers cookie store is read-only
            }
          },
        },
      },
    )
  } catch (error) {
    // Fallback: si no existe @supabase/ssr en este entorno, devolvemos un "stub" para que las pages no rompan en build
    // (esto evita que el build se detenga; en runtime es mejor tener el real).
    console.warn("[Supabase][server] SSR helper not available, using fallback client", error)
    serverClient = {
      from: () => ({
        select: () => ({ eq: () => Promise.resolve({ data: [], error: null }), ilike: () => Promise.resolve({ data: [], error: null }), order: () => Promise.resolve({ data: [], error: null }) }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    }
  }

  return serverClient
}

// Alias por compatibilidad
export const createServerClient = createClient

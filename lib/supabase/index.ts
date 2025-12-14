// lib/supabase/index.ts
// re-exports claros y sin alias ambiguos
export { createBrowserSupabase } from "./client";
export { createBrowserSupabase as createBrowserClient } from "./client"; // alias cliente
export { createServerClient, createServerSupabase } from "./server";
export { createAdminClient } from "./admin";

// NOTA: intencionadamente NO exportamos `createClient` como alias server
// para evitar importarlo por error desde componentes cliente.
// Si tienes algún import que use `createClient` en cliente, cámbialo explícitamente
// a `import { createBrowserSupabase } from "@/lib/supabase/client";`

// si tienes proxy/updateSession
export { updateSession } from "./proxy";

// lib/supabase/index.ts
/**
 * Re-exports centralizados para los helpers de Supabase.
 *
 * - createBrowserSupabase: cliente singleton para el navegador.
 * - createBrowserClient: alias histórico para compatibilidad.
 * - createServerClient / createServerSupabase: helpers server-side que respetan cookies (SSR).
 * - createClient: alias histórico que apunta al cliente server (mantener compatibilidad con imports antiguos).
 * - createAdminClient: cliente con SERVICE_ROLE (server-only).
 * - updateSession: proxy helper (si existe).
 */

export { createBrowserSupabase } from "./client";
export { createBrowserSupabase as createBrowserClient } from "./client"; // alias histórico (client)

export { createServerClient, createServerSupabase } from "./server";
export { createServerClient as createClient } from "./server"; // alias histórico -> servidor

export { createAdminClient } from "./admin";

// Si tienes proxy/updateSession en ./proxy
export { updateSession } from "./proxy";

// lib/supabase/index.ts
export { createClient as createBrowserClient } from "./client"
export { createClient as createServerClient, createClient } from "./server"
export { createAdminClient } from "./admin"
export { updateSession } from "./proxy"

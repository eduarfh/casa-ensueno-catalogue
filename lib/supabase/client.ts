// lib/supabase/admin.ts

"use client"

import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (typeof window === "undefined") {
    return null
  }

  // Only create client once
  if (supabaseClient) {
    return supabaseClient
  }

  try {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  } catch (error) {
    console.warn("[Supabase] Error creating client:", error)
  }

  return supabaseClient
}

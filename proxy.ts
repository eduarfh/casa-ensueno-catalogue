//proxy.ts

import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  // Simplified proxy - just pass through
  // Authentication will be handled by route-specific logic
  return null
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

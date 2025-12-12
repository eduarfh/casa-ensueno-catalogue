// components/admin-header.tsx
"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AdminHeader() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          Casa Ensueño • Store
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/admin/registrations" className="text-sm font-medium hover:text-primary transition-colors">
            Solicitudes
          </Link>
          {email ? (
            <>
              <span className="text-sm text-muted-foreground">{email}</span>
              <button onClick={handleLogout} className="text-sm font-medium hover:text-primary transition-colors">
                Salir
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

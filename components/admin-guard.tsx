// components/ui/admin-guard.tsx
"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface Props {
  children: React.ReactNode
}

/**
 * AdminGuard: componente cliente que asegura que haya un usuario autenticado.
 * - Si NO hay user, redirige a /auth/login
 * - Mientras comprueba, muestra un loader simple
 *
 * Úsalo envolviendo la UI admin que antes hacía comprobaciones en server.
 */
export default function AdminGuard({ children }: Props) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          router.replace("/auth/login");
          return;
        }

        // check admin role server-side
        const res = await fetch("/api/admin/check");
        const json = await res.json();
        if (!json?.isAdmin) {
          router.replace("/auth/login");
          return;
        }

        if (mounted) setAuthorized(true);
      } catch {
        router.replace("/auth/login");
      } finally {
        if (mounted) setChecking(false);
      }
    }

    check();
    return () => {
      mounted = false;
    };
  }, [router]);


  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Cargando sesión...</div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}

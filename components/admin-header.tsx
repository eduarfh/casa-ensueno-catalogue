// components/admin-header.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AdminCheckResp = {
  ok?: boolean;
  isAdmin?: boolean;
  user?: { id?: string; email?: string } | null;
  error?: string;
};

export function AdminHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchUser() {
      try {
        setChecking(true);
        const res = await fetch("/api/admin/check", {
          method: "GET",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });

        if (!mounted) return;

        if (!res.ok) {
          // no session / not admin -> keep email null
          setEmail(null);
          setChecking(false);
          return;
        }

        const json = (await res.json()) as AdminCheckResp;
        if (json?.isAdmin && json?.user?.email) {
          setEmail(json.user.email ?? null);
        } else {
          setEmail(null);
        }
      } catch (err) {
        console.warn("[AdminHeader] fetch /api/admin/check failed:", err);
        setEmail(null);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      // First, try client signOut if you have a client supabase instance (optional)
      // but the important part is clearing server cookies:
      await fetch("/api/auth/clear-session", {
        method: "POST",
        credentials: "same-origin",
      }).catch((e) => {
        console.warn("[AdminHeader] clear-session failed:", e);
      });

      // Also try client-side signOut if you want (optional). Then navigate away:
      setEmail(null);

      // Use full navigation to ensure server/SSRed pages reflect logged-out state
      window.location.href = "/";
    } catch (err) {
      console.error("[AdminHeader] logout unexpected:", err);
      window.location.href = "/";
    }
  };

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

          {/* mientras comprobamos la sesión evitamos mostrar "Iniciar sesión" parpadeante */}
          {checking ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : email ? (
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
  );
}

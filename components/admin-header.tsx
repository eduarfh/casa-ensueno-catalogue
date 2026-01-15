// components/admin-header.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Menu, X } from "lucide-react";

type AdminCheckResp = {
  ok?: boolean;
  isAdmin?: boolean;
  user?: { id?: string; email?: string } | null;
  error?: string;
};

export function AdminHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);

  const prevThemeDark = useRef<boolean | null>(null);

  const closeMenu = () => setOpen(false);
  const toggleMenu = () => setOpen((v) => !v);

  // fetch admin session (client-side)
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
        if (mounted) setEmail(null);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  // keyboard: cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Observa cambios en theme en <html> (clase 'dark' o atributo 'data-theme')
  useEffect(() => {
    if (typeof document === "undefined") return;

    const el = document.documentElement;
    const checkIsDark = () =>
      el.classList.contains("dark") || el.getAttribute("data-theme") === "dark";

    prevThemeDark.current = checkIsDark();

    const mo = new MutationObserver(() => {
      const nowDark = checkIsDark();
      // si cambió el tema, cerramos el menú
      if (prevThemeDark.current !== null && nowDark !== prevThemeDark.current) {
        closeMenu();
      }
      prevThemeDark.current = nowDark;
    });

    mo.observe(el, { attributes: true, attributeFilter: ["class", "data-theme"] });

    return () => mo.disconnect();
  }, []);

  const handleBackgroundClick = () => {
    closeMenu();
  };

  const handleLogout = async () => {
    try {
      // Clear server cookies / session
      await fetch("/api/auth/clear-session", {
        method: "POST",
        credentials: "same-origin",
      }).catch((e) => {
        console.warn("[AdminHeader] clear-session failed:", e);
      });

      // reset local state so UI updates immediately
      setEmail(null);

      // full navigation to ensure SSR shows logged-out state
      window.location.href = "/";
    } catch (err) {
      console.error("[AdminHeader] logout unexpected:", err);
      window.location.href = "/";
    }
  };

  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand (logo + texto) */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 rounded-2xl overflow-hidden w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24">
              <Link href="/" aria-label="Casa Ensueño - Inicio">
                <Image
                  src="https://jgxqopmrwuxyfirpvbhz.supabase.co/storage/v1/object/public/casaensueno%20files/logo%20con%20fondo%20recortado%20baja%20calidad%20(1).jpg"
                  alt="Logo Casa Ensueño"
                  fill
                  className="object-contain"
                  priority
                />
              </Link>
            </div>

            <div className="leading-tight">
              <Link href="/" className="block">
                <h1 className="text-lg sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                  Casa Ensueño • Admin
                </h1>
                <p className="text-[11px] sm:text-sm text-muted-foreground hidden sm:block">
                  Panel de administración
                </p>
              </Link>
            </div>
          </div>

          {/* Desktop nav (hidden en xs) + mobile menu button */}
          <div className="flex items-center gap-2">
            {/* Nav visible en sm+ */}
            <nav className="hidden sm:flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/registrations"
                  className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                >
                  Solicitudes
                </Link>

                {/* Mantener botones originales: si hay sesión mostrar email + Salir; si no, link a login */}
                {checking ? (
                  <div className="text-sm text-muted-foreground px-2 py-1">Cargando...</div>
                ) : email ? (
                  <>
                    <span className="text-xs sm:text-sm text-muted-foreground px-2 py-1">{email}</span>
                    <button
                      onClick={handleLogout}
                      className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                    >
                      Salir
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
                  >
                    Iniciar sesión
                  </Link>
                )}

                <div className="inline-flex items-center px-1">
                  <ThemeToggle />
                </div>
              </div>
            </nav>

            <ThemeToggle />
            {/* Mobile menu toggle */}
            <button
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={toggleMenu}
              className="sm:hidden p-2 rounded-md hover:bg-muted/10 active:scale-95 transition"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY móvil */}
      <div className={`sm:hidden absolute inset-x-0 top-0 h-full z-50 pointer-events-none`} aria-hidden={!open}>
        {/* capa de fondo que capta clicks */}
        <div
          onClick={handleBackgroundClick}
          className={`absolute inset-0 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          aria-hidden="true"
        />

        {/* panel que ocupa todo el espacio del header */}
        <div
          className={`w-full h-full px-4 py-2 flex items-center transition-all duration-300 ease-out origin-top
            ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"}`}
          role={open ? "dialog" : undefined}
          aria-modal={open ? "true" : undefined}
        >
          <div
            className="relative w-full h-full flex items-center justify-center gap-3 px-4 py-1 rounded-2xl
             backdrop-blur-[60px] supports-[backdrop-filter]:backdrop-blur-[60px]
             bg-white/50 dark:bg-slate-900/70
             border border-white/30 dark:border-white/30
             shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >



            {/* Links centrados */}
            <div className="flex items-center gap-3">
              <Link
                href="/admin/registrations"
                className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md"
                onClick={closeMenu}
              >
                Solicitudes
              </Link>

              {checking ? (
                <div className="text-sm text-muted-foreground px-3 py-2 rounded-md">Cargando...</div>
              ) : email ? (
                <>
                  <span className="text-sm text-muted-foreground px-3 py-2 rounded-md">{email}</span>
                  <button
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                    className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md"
                  onClick={closeMenu}
                >
                  Iniciar sesión
                </Link>
              )}

              <div
                role="button"
                tabIndex={0}
                onClick={closeMenu}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    closeMenu();
                  }
                }}
                className="inline-flex items-center px-1"
                aria-label="Cambiar tema y cerrar menú"
              >
              </div>
            </div>

            {/* Botón X dentro del panel */}
            <button
              onClick={closeMenu}
              aria-label="Cerrar menú"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-muted/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;

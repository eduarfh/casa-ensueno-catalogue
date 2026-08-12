"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Boxes, GalleryHorizontal, Grid2X2, List, Menu, PackageSearch, X } from "lucide-react";
import { Button } from "./ui/button";

interface SiteHeaderProps {
  user?: {
    id?: string;
    email?: string;
  } | null;
}

export default function SiteHeader({ user = null }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);

  const prevThemeDark = useRef<boolean | null>(null);

  const closeMenu = () => setOpen(false);
  const toggleMenu = () => setOpen((v) => !v);

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

  // handler para clicks en el fondo del overlay (cierra)
  const handleBackgroundClick = () => {
    closeMenu();
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
                  src="https://yzjvywcplllhsqqcfsyb.supabase.co/storage/v1/object/public/Fotos%20Catalogo/logo%20con%20fondo%20recortado%20baja%20calidad.jpg"
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
                  Casa Ensueño
                </h1>
                <p className="text-[11px] sm:text-sm text-muted-foreground hidden sm:block">
                  Catálogo
                </p>
              </Link>
            </div>
          </div>

          {/* Desktop nav (hidden en xs) + mobile menu button */}
          <div className="flex items-center gap-2">
            {/* Nav visible en sm+ */}
            <nav className="hidden sm:flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                {/* <Link
                  href="/catalog"
                  className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md"

                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent"
                  >
                    <PackageSearch className="h-4 w-4" />
                  </Button>
                </Link> */}

                
                <div className="inline-flex items-center px-1">
                  <ThemeToggle />
                </div>
              </div>
            </nav>

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

      {/* OVERLAY móvil: ahora el panel ocupa TODO el ancho y la altura del header.
          - La capa background captura clicks fuera del panel (para cerrar).
          - El panel es full-width dentro del header y mantiene glasmorfismo.
          - Incluye una X de cierre dentro del panel (a la derecha). */}
      <div
        className={`sm:hidden absolute inset-x-0 top-0 h-full z-50 pointer-events-none`}
        aria-hidden={!open}
      >
        {/* capa de fondo que capta clicks (cuando open=true permite pointer events) */}
        <div
          onClick={handleBackgroundClick}
          className={`absolute inset-0 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          aria-hidden="true"
        />

        {/* panel que ocupa todo el espacio del header (w-full h-full) */}
        <div
          className={`w-full h-full px-4 py-2 flex items-center transition-all duration-300 ease-out origin-top
            ${open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"}
          `}
          role={open ? "dialog" : undefined}
          aria-modal={open ? "true" : undefined}
        ><div
          className="relative w-full h-full flex items-center justify-center gap-3 px-4 py-1 rounded-2xl
             bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80
             border border-white/30 
             shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Links centrados */}
            <div className="flex items-center gap-3">
              <Link
                href="/catalog"
                className="text-sm font-medium hover:text-primary transition-colors px-3 py-2 rounded-md"

              >
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                >
                  <PackageSearch className="h-4 w-4" />
                </Button>
              </Link>





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
                <ThemeToggle />
              </div>
            </div>

            {/* Botón X dentro del panel para cerrar (derecha, verticalmente centrado) */}
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

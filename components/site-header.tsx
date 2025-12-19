// components/site-header.tsx
"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

interface SiteHeaderProps {
  user?: {
    id?: string;
    email?: string;
    // cualquier otro campo que quieras usar en el header
  } | null;
}

export default function SiteHeader({ user = null }: SiteHeaderProps) {
  return (
    <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-1 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* ajuste: menos padding externo y tamaño fijo del wrapper (responsive) */}
          <div className="p-1 bg-transparent">
            {/* contenedor relativo con w/h controladas; Image usará `fill` */}
            <div className="relative flex-shrink-0 rounded-2xl overflow-hidden w-20 h-20 sm:w-25 sm:h-20 md:w-24 md:h-24">
              <Link href="/">
                <Image
                  src="https://jgxqopmrwuxyfirpvbhz.supabase.co/storage/v1/object/public/casaensueno%20files/logo%20con%20fondo%20recortado%20baja%20calidad%20(1).jpg"
                  alt="Logo Casa Eueños"
                  fill
                  className="object-contain"
                  priority
                />
              </Link>
            </div>
          </div>
          <Link href="/">
            <h1 className="text-xl sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors">Casa Ensueño • Store</h1>
            <p className="text-sm text-muted-foreground hover:text-muted-foreground/80">Todo para tu hogar de ensueño</p>
          </Link>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/catalog"
            className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
          >
            Catálogo
          </Link>

          {user ? (
            <>
              <Link
                href="/admin"
                className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
              >
                Dashboard
              </Link>
              <Link
                href="/auth/logout"
                className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
              >
                Salir
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
            >
              Admin
            </Link>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

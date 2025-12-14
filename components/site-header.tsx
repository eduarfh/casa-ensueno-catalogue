// components/site-header.tsx
"use client";

import Link from "next/link";
import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
          Casa Ensueño • Store
        </Link>

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

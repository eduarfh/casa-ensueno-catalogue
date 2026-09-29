// components/admin-header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Menu, Settings, X, Key } from "lucide-react";
import { Button } from "./ui/button";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

export function AdminHeader() {
  const [username, setUsername] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const isVisible = useScrollDirection();

  const closeMenu = () => setOpen(false);
  const toggleMenu = () => setOpen((v) => !v);

  // Fetch admin session (client-side)
  useEffect(() => {
    let mounted = true;
    
    async function fetchUser() {
      try {
        setChecking(true);
        const res = await fetch("/api/auth/admin-credentials", {
          method: "GET",
          credentials: "same-origin",
        });

        if (!mounted) return;

        if (res.ok) {
          const data = await res.json();
          if (mounted) setUsername(data.username || null);
        } else {
          if (mounted) setUsername(null);
        }
      } catch (err) {
        console.warn("[AdminHeader] fetch admin session failed:", err);
        if (mounted) setUsername(null);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    fetchUser();
    return () => {
      mounted = false;
    };
  }, []);

  // Cerrar menú con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin-logout", {
        method: "POST",
        credentials: "same-origin",
      });
      
      setUsername(null);
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("[AdminHeader] logout error:", err);
      window.location.href = "/auth/login";
    }
  };

  // Componente reutilizable para mostrar el estado de usuario
  const UserStatus = () => {
    if (checking) {
      return (
        <div className="text-sm text-muted-foreground px-2 py-1">
          Cargando...
        </div>
      );
    }
    
    if (username) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50">
          <span className="text-xs font-medium text-muted-foreground">Admin:</span>
          <span className="text-sm font-semibold">{username}</span>
        </div>
      );
    }
    
    return (
      <Link
        href="/auth/login"
        className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
        onClick={closeMenu}
      >
        Iniciar sesión
      </Link>
    );
  };

  // Componente reutilizable para los botones de acción
  const ActionButtons = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <Link href="/admin/settings">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent transition-colors"
          aria-label="Configuración de credenciales"
        >
          <Key className="h-4 w-4" />
        </Button>
      </Link>

      <Link href="/admin/store">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent transition-colors"
          aria-label="Configuración de la tienda"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </Link>

      <ThemeToggle />

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (isMobile) closeMenu();
          handleLogout();
        }}
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-transparent"
        aria-label="Cerrar sesión"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </>
  );

  return (
    <header 
      className={`border-b border-border fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              aria-label="Casa Ensueño - Inicio"
              className="relative flex-shrink-0 rounded-2xl overflow-hidden w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24"
            >
              <Image
                src="https://yzjvywcplllhsqqcfsyb.supabase.co/storage/v1/object/public/Fotos%20Catalogo/logo%20con%20fondo%20recortado%20baja%20calidad.jpg"
                alt="Logo Casa Ensueño"
                fill
                className="object-contain"
                priority
              />
            </Link>

            <Link href="/" className="leading-tight">
              <h1 className="text-lg sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
                Casa Ensueño
              </h1>
              <p className="text-[11px] sm:text-sm text-muted-foreground">
                Administración
              </p>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-2">
            <UserStatus />
            <ActionButtons />
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={toggleMenu}
            className="sm:hidden p-2 rounded-md hover:bg-muted/10 active:scale-95 transition"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {open && (
        <div 
          className="sm:hidden fixed inset-0 top-[100px] z-50 bg-black/20 backdrop-blur-sm"
          onClick={closeMenu}
        >
          <div 
            className="absolute right-4 top-4 bg-background border border-border rounded-lg shadow-xl p-4 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeMenu}
              aria-label="Cerrar menú"
              className="absolute right-2 top-2 p-1 rounded-md hover:bg-muted/50 transition"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col gap-3 pt-6">
              <UserStatus />
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <ActionButtons isMobile />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default AdminHeader;

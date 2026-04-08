// components/ui/admin-guard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkServer() {
      try {
        const res = await fetch("/api/auth/admin-check", {
          method: "GET",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          if (mounted) router.replace("/auth/login");
          return;
        }

        const json = await res.json();
        if (json?.isAdmin) {
          if (mounted) setAuthorized(true);
        } else {
          if (mounted) router.replace("/auth/login");
        }
      } catch (err) {
        console.error("[AdminGuard] error checking server session:", err);
        if (mounted) router.replace("/auth/login");
      } finally {
        if (mounted) setChecking(false);
      }
    }

    checkServer();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Cargando sesión...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

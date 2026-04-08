// app/auth/login/page.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log("[auth/login] Attempting admin login for:", username);

      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Error al iniciar sesión");
      }

      toast({
        title: "Inicio de sesión exitoso",
        description: "Redirigiendo al panel de administración...",
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/admin");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrió un error";
      console.error("[auth/login] Login failed:", error);
      setError(message);
      toast({
        title: "Error de inicio de sesión",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder al dashboard de administración</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6" aria-label="Formulario de inicio de sesión">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
            {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
          {/* <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Credenciales por defecto:</p>
            <p className="font-mono text-xs mt-1">Usuario: admin | Contraseña: admin123</p>
            <p className="text-xs mt-2">Cámbialas desde el panel de administración</p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}

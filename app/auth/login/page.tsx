"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setError("No se pudo inicializar el cliente de autenticación");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Log seguro para debug (no mostrar tokens)
      // hasSession indica si la respuesta incluyó sesión inmediatamente
      console.log("[auth/login] signIn result", {
        hasSession: !!data?.session,
        userId: data?.user?.id ?? null,
        error: error ? error.message ?? error : null,
      });

      if (error) throw error;

      // Si la respuesta incluye session -> redirigir de inmediato
      if (data?.session) {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Redirigiendo al dashboard...",
        });
        router.push("/admin");
        return;
      }

      // Si no hay session inmediata, esperamos al evento SIGNED_IN como fallback
      const TIMEOUT_MS = 5000;
      let resolved = false;

      const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("[auth/login] onAuthStateChange event:", event);
        if (event === "SIGNED_IN" && session) {
          resolved = true;
          toast({
            title: "Inicio de sesión exitoso",
            description: "Redirigiendo al dashboard...",
          });
          router.push("/admin");
        }
      });

      // Espera hasta TIMEOUT_MS por la sesión
      await new Promise((res) => setTimeout(res, TIMEOUT_MS));

      // cleanup suscripción
      try {
        subData?.subscription?.unsubscribe?.();
      } catch {
        // ignore
      }

      if (!resolved) {
        // No llegó la sesión en el tiempo esperado
        throw new Error("No se pudo establecer la sesión tras iniciar sesión. Intenta recargar o revisa las cookies.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrió un error";
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
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
          <div className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

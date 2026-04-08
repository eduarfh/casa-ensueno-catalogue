"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AdminHeader } from "@/components/admin-header";
import AdminGuard from "@/components/admin-guard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminSettingsPage() {
  const [currentUsername, setCurrentUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingUsername, setLoadingUsername] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsername() {
      try {
        const res = await fetch("/api/auth/admin-credentials", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUsername(data.username);
          setNewUsername(data.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      } finally {
        setLoadingUsername(false);
      }
    }

    fetchUsername();
  }, []);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (newUsername.length < 3) {
      toast({
        title: "Error",
        description: "El usuario debe tener al menos 3 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/admin-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newUsername,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar credenciales");
      }

      toast({
        title: "Credenciales actualizadas",
        description: "Las credenciales se han actualizado correctamente en la base de datos",
      });

      setCurrentUsername(newUsername);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al panel
                </Button>
              </Link>
            </div>

            <h1 className="text-3xl font-bold mb-2">Configuración de Administración</h1>
            <p className="text-muted-foreground mb-8">
              Gestiona las credenciales de acceso al panel de administración
            </p>

            <Card>
              <CardHeader>
                <CardTitle>Cambiar Credenciales</CardTitle>
                <CardDescription>
                  Actualiza tu usuario y contraseña de administrador
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsername ? (
                  <div className="text-center py-4">Cargando...</div>
                ) : (
                  <form onSubmit={handleUpdateCredentials} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Usuario Actual</Label>
                      <Input
                        type="text"
                        value={currentUsername}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña Actual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-4">Nuevas Credenciales</h3>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newUsername">Nuevo Usuario</Label>
                          <Input
                            id="newUsername"
                            type="text"
                            placeholder="admin"
                            required
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            disabled={isLoading}
                            autoComplete="username"
                            minLength={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Mínimo 3 caracteres
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nueva Contraseña</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="new-password"
                            minLength={6}
                          />
                          <p className="text-xs text-muted-foreground">
                            Mínimo 6 caracteres
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="new-password"
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Actualizando..." : "Actualizar Credenciales"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Información Importante</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Las credenciales se almacenan de forma segura en Supabase</li>
                <li>Los cambios son inmediatos y persistentes</li>
                <li>Funcionan en desarrollo y producción sin configuración adicional</li>
                <li>Asegúrate de recordar tus nuevas credenciales</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}

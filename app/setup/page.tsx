// app/setup/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { redirect, useRouter } from "next/navigation"

export default function SetupPage() {
  const [email, setEmail] = useState("fheduardo136@gmail.com")
  const [password, setPassword] = useState("12345678")
  const [isLoading, setIsLoading] = useState(false)
  const [hasAdmins, setHasAdmins] = useState<boolean | null>(null)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkForAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkForAdmins = async () => {
    try {
      const { data } = await supabase.from("admin_users").select("id").limit(1)
      if (data && data.length > 0) {
        setHasAdmins(true)
        // Redirect to login if admins already exist
        router.push("/auth/login")
      } else {
        setHasAdmins(false)
      }
    } catch (err) {
      // Table might not exist yet; show setup
      setHasAdmins(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Email y contraseña son requeridos",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/create-initial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Error creating admin")
      }

      toast({
        title: "Éxito",
        description: "Administrador creado exitosamente. Redirigiendo al login...",
      })

      setTimeout(() => {
        router.push("/auth/login")
      }, 1000)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear administrador"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // If we haven't checked yet don't render anything major
  if (hasAdmins === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Comprobando configuración...</div>
      </div>
    )
  }

  // If admins exist we should redirect or render nothing
  if (hasAdmins) {
    // Redirect handled in checkForAdmins; render nothing here
    return null
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Configuración Inicial</CardTitle>
          <CardDescription>Crea la cuenta de administrador principal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email del Administrador</Label>
              <Input
                id="email"
                type="email"
                placeholder="fheduardo136@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Administrador"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

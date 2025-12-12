// app/auth/error/page.tsx
export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Error</CardTitle>
          <CardDescription>Ocurrió un error durante la autenticación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Por favor intenta de nuevo o contacta al soporte si el problema persiste.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">Volver al inicio de sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

//app/page.tsx

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, Sparkles, Truck } from "lucide-react"

export default async function Home() {
  // Removed Supabase dependency for initial load
  const user = null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            HomeDecor
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/catalog" className="text-sm font-medium hover:text-primary transition-colors">
              Catálogo
            </Link>
            {user ? (
              <>
                <Link href="/admin" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link href="/auth/logout" className="text-sm font-medium hover:text-primary transition-colors">
                  Salir
                </Link>
              </>
            ) : (
              <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center space-y-12 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">Transforma tu hogar en un espacio único</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Descubre nuestra colección curada de útiles y decoración para crear el hogar de tus sueños
            </p>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link href="/catalog">Explorar Catálogo</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Acceso Administrador</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg bg-white border border-border hover:shadow-lg transition-shadow">
              <Sparkles className="w-8 h-8 text-secondary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Diseño de Calidad</h3>
              <p className="text-sm text-muted-foreground">Productos cuidadosamente seleccionados</p>
            </div>
            <div className="p-6 rounded-lg bg-white border border-border hover:shadow-lg transition-shadow">
              <Truck className="w-8 h-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Entrega Rápida</h3>
              <p className="text-sm text-muted-foreground">Envío seguro y confiable</p>
            </div>
            <div className="p-6 rounded-lg bg-white border border-border hover:shadow-lg transition-shadow">
              <Heart className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Con Amor</h3>
              <p className="text-sm text-muted-foreground">Hecho con dedicación</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

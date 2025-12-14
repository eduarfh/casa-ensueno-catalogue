// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Truck } from "lucide-react";
import SiteHeader from "@/components/site-header";

export default async function Home() {
  // Si en el futuro traes usuario desde supabase, pásalo a SiteHeader
  const user = null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-8 sm:space-y-12 max-w-3xl mx-auto">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight">
              Transforma tu hogar en un espacio único
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground text-balance px-4">
              Descubre nuestra colección curada de útiles y decoración para crear el hogar de tus sueños
            </p>
          </div>

          <div className="flex gap-3 sm:gap-4 justify-center flex-wrap px-4">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
            >
              <Link href="/catalog">Explorar Catálogo</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-primary/30 hover:bg-primary/10 bg-transparent"
            >
              <Link href="/auth/login">Acceso Administrador</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 px-4 sm:px-0">
            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-secondary mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">Diseño de Calidad</h3>
              <p className="text-sm text-muted-foreground">Productos cuidadosamente seleccionados</p>
            </div>
            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-accent mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">Entrega Rápida</h3>
              <p className="text-sm text-muted-foreground">Envío seguro y confiable</p>
            </div>
            <div className="p-6 sm:p-8 rounded-lg bg-card border border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-3 sm:mb-4" />
              <h3 className="font-semibold text-base sm:text-lg mb-2">Con Amor</h3>
              <p className="text-sm text-muted-foreground">Hecho con dedicación</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

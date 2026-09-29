"use client";

import { AdminHeader } from "@/components/admin-header";
import AdminGuard from "@/components/admin-guard";
import { ArrowLeft, Tag, DollarSign, Store } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminStorePage() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <AdminHeader />
        {/* Espaciador para compensar el header fixed */}
        <div className="h-24 sm:h-28 md:h-32" />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/admin">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </Button>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Configuración de la Tienda</h1>
              <p className="text-muted-foreground">
                Administra la información, categorías y monedas de tu tienda
              </p>
            </div>

            {/* Información de la Tienda */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Información de la Tienda</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Configura el nombre, ubicación, horarios y contactos de tu tienda
              </p>
              <Link href="/admin/store/info">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Store className="h-5 w-5 mr-2 text-primary" />
                  Editar Información de la Tienda
                </Button>
              </Link>
            </Card>

            {/* Gestión de Catálogo */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gestión de Catálogo</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Administra las categorías de productos y las monedas disponibles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/categories">
                  <Button variant="outline" className="w-full h-auto py-4 px-6 flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Categorías</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      Gestiona las categorías de tus productos
                    </span>
                  </Button>
                </Link>

                <Link href="/admin/currencies">
                  <Button variant="outline" className="w-full h-auto py-4 px-6 flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Monedas</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      Configura las monedas y precios
                    </span>
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}

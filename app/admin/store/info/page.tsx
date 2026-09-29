// app/admin/store/info/page.tsx
"use client";

import { AdminHeader } from "@/components/admin-header";
import AdminGuard from "@/components/admin-guard";
import AdminStoreForm from "@/components/store-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function StoreInfoPage() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <AdminHeader />
        {/* Espaciador para compensar el header fixed */}
        <div className="h-24 sm:h-28 md:h-32" />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/admin/store">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a configuración
                </Button>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Información de la Tienda</h1>
              <p className="text-muted-foreground">
                Edita el nombre, ubicación, horarios y contactos de tu tienda
              </p>
            </div>

            <Card className="p-6">
              <AdminStoreForm />
            </Card>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}

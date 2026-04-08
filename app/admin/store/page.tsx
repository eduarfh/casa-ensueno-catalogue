"use client";

import React from "react";
import { AdminHeader } from "@/components/admin-header";
import AdminGuard from "@/components/admin-guard";
import AdminStoreForm from "@/components/store-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminStorePage() {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al panel
                </Button>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Configuración de la Tienda</h1>
              <p className="text-muted-foreground">
                Edita la información que se muestra en tu tienda y configura el contacto de WhatsApp
              </p>
            </div>

            <AdminStoreForm />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}

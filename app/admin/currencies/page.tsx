// app/admin/currencies/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Save, X, ArrowLeft, AlertCircle, Edit, Edit2Icon, Edit2, LucideEdit2 } from "lucide-react";
import Link from "next/link";
import AdminGuard from "@/components/admin-guard";

type Currency = {
  id: string;
  code: string;
  symbol: string;
  name: string;
  is_active: boolean;
  display_order: number;
};

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCurrency, setNewCurrency] = useState({
    code: "",
    symbol: "",
    name: "",
    is_active: true,
    display_order: 0,
  });
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/currencies");
      if (!res.ok) throw new Error("Error al cargar monedas");
      const data = await res.json();
      setCurrencies(data.currencies || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las monedas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCurrency.code || !newCurrency.symbol || !newCurrency.name) {
      toast({
        title: "Campos incompletos",
        description: "Debes completar todos los campos",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing("create");
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCurrency),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear moneda");
      }

      toast({
        title: "Moneda creada",
        description: "La moneda se ha creado correctamente",
      });

      setNewCurrency({ code: "", symbol: "", name: "", is_active: true, display_order: 0 });
      setShowAddForm(false);
      fetchCurrencies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdate = async (currency: Currency) => {
    try {
      setProcessing(currency.id);
      const res = await fetch("/api/currencies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currency),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar moneda");
      }

      toast({
        title: "Moneda actualizada",
        description: "Los cambios se han guardado correctamente",
      });

      setEditingId(null);
      fetchCurrencies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`¿Estás seguro de eliminar la moneda ${code}?`)) return;

    try {
      setProcessing(id);
      const res = await fetch(`/api/currencies?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar moneda");
      }

      toast({
        title: "Moneda eliminada",
        description: "La moneda se ha eliminado correctamente",
      });

      fetchCurrencies();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleCurrencyChange = (id: string, field: keyof Currency, value: any) => {
    setCurrencies(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background">
          <AdminHeader />
          {/* Espaciador para compensar el header fixed */}
          <div className="h-24 sm:h-28 md:h-32" />
          <main className="container mx-auto px-4 py-8">
            <p>Cargando monedas...</p>
          </main>
        </div>
      </AdminGuard>
    );
  }

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
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Gestión de Monedas</h1>
                <p className="text-muted-foreground">
                  Administra las monedas disponibles para los productos
                </p>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)} disabled={processing !== null}>
                {showAddForm ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Moneda
                  </>
                )}
              </Button>
            </div>

            {showAddForm && (
              <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Crear Nueva Moneda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-code">Código (3 letras)</Label>
                <Input
                  id="new-code"
                  value={newCurrency.code}
                  onChange={(e) =>
                    setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })
                  }
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="new-symbol">Símbolo</Label>
                <Input
                  id="new-symbol"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  placeholder="$"
                />
              </div>
              <div>
                <Label htmlFor="new-name">Nombre</Label>
                <Input
                  id="new-name"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  placeholder="Dólar Estadounidense"
                />
              </div>
              <div>
                <Label htmlFor="new-order">Orden de visualización</Label>
                <Input
                  id="new-order"
                  type="number"
                  value={newCurrency.display_order}
                  onChange={(e) =>
                    setNewCurrency({ ...newCurrency, display_order: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="new-active"
                checked={newCurrency.is_active}
                onChange={(e) => setNewCurrency({ ...newCurrency, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="new-active">Activa</Label>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleCreate} disabled={processing !== null}>
                {processing === "create" ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} disabled={processing !== null}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {/* Información sobre monedas */}
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Sobre las monedas:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Cada producto puede tener precios en múltiples monedas</li>
                <li>Solo se pueden eliminar monedas que no estén asignadas a productos</li>
                <li>El orden de visualización controla cómo aparecen en el catálogo</li>
                <li>Las monedas inactivas no se mostrarán al crear/editar productos</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {currencies.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  No hay monedas configuradas. Crea una nueva para comenzar.
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Moneda
                </Button>
              </div>
            </Card>
          ) : (
            currencies.map((currency) => (
              <Card key={currency.id} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <Label className="text-xs text-muted-foreground">Código</Label>
                    {editingId === currency.id ? (
                      <Input
                        value={currency.code}
                        onChange={(e) =>
                          handleCurrencyChange(currency.id, "code", e.target.value.toUpperCase())
                        }
                        maxLength={3}
                      />
                    ) : (
                      <p className="font-semibold">{currency.code}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Símbolo</Label>
                    {editingId === currency.id ? (
                      <Input
                        value={currency.symbol}
                        onChange={(e) => handleCurrencyChange(currency.id, "symbol", e.target.value)}
                      />
                    ) : (
                      <p className="font-semibold">{currency.symbol}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Nombre</Label>
                    {editingId === currency.id ? (
                      <Input
                        value={currency.name}
                        onChange={(e) => handleCurrencyChange(currency.id, "name", e.target.value)}
                      />
                    ) : (
                      <p className="font-semibold">{currency.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Orden</Label>
                    {editingId === currency.id ? (
                      <Input
                        type="number"
                        value={currency.display_order}
                        onChange={(e) =>
                          handleCurrencyChange(currency.id, "display_order", parseInt(e.target.value))
                        }
                      />
                    ) : (
                      <p className="font-semibold">{currency.display_order}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {editingId === currency.id ? (
                      <>
                        <Button size="sm" onClick={() => handleUpdate(currency)} disabled={processing !== null}>
                          {processing === currency.id ? "..." : <Save className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={processing !== null}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(currency.id)}
                          disabled={processing !== null}
                        >
                          <LucideEdit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(currency.id, currency.code)}
                          disabled={processing !== null}
                        >
                          {processing === currency.id ? "..." : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="checkbox"
                    id={`active-${currency.id}`}
                    checked={currency.is_active}
                    onChange={(e) => {
                      if (editingId === currency.id) {
                        handleCurrencyChange(currency.id, "is_active", e.target.checked);
                      }
                    }}
                    disabled={editingId !== currency.id}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`active-${currency.id}`}>
                    {currency.is_active ? "Activa" : "Inactiva"}
                  </Label>
                </div>
              </Card>
            ))
          )}
        </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}

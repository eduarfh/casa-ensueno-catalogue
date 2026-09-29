// app/admin/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Save, X, ArrowLeft, AlertCircle, Edit, Edit2 } from "lucide-react";
import Link from "next/link";
import AdminGuard from "@/components/admin-guard";

type Category = {
  name: string;
  count: number; // número de productos con esta categoría
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Obtener todas las categorías únicas con conteo de productos
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Error al cargar categorías");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast({
        title: "Campo vacío",
        description: "Debes ingresar un nombre para la categoría",
        variant: "destructive",
      });
      return;
    }

    // Verificar si ya existe
    if (categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Categoría duplicada",
        description: "Ya existe una categoría con ese nombre",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing("create");
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear categoría");
      }

      toast({
        title: "Categoría creada",
        description: `La categoría "${trimmed}" se ha creado correctamente`,
      });

      setNewCategoryName("");
      setShowAddForm(false);
      fetchCategories();
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

  const handleUpdate = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast({
        title: "Campo vacío",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    if (oldName === trimmed) {
      setEditingCategory(null);
      return;
    }

    // Verificar si el nuevo nombre ya existe
    if (categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.name !== oldName)) {
      toast({
        title: "Categoría duplicada",
        description: "Ya existe una categoría con ese nombre",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(oldName);
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName: trimmed }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al actualizar categoría");
      }

      toast({
        title: "Categoría actualizada",
        description: `Se actualizó "${oldName}" a "${trimmed}"`,
      });

      setEditingCategory(null);
      setEditValue("");
      fetchCategories();
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

  const handleDelete = async (name: string, count: number) => {
    if (count > 0) {
      if (!confirm(`La categoría "${name}" tiene ${count} producto${count !== 1 ? 's' : ''}. ¿Deseas eliminarla de todos los productos?`)) {
        return;
      }
    } else {
      if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
        return;
      }
    }

    try {
      setProcessing(name);
      const res = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al eliminar categoría");
      }

      toast({
        title: "Categoría eliminada",
        description: count > 0 
          ? `Se eliminó la categoría "${name}" de ${count} producto${count !== 1 ? 's' : ''}`
          : `La categoría "${name}" se ha eliminado`,
      });

      fetchCategories();
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

  const startEdit = (name: string) => {
    setEditingCategory(name);
    setEditValue(name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background">
          <AdminHeader />
          {/* Espaciador para compensar el header fixed */}
          <div className="h-24 sm:h-28 md:h-32" />
          <main className="container mx-auto px-4 py-8">
            <p>Cargando categorías...</p>
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
          <div className="max-w-3xl mx-auto">
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
                <h1 className="text-3xl font-bold mb-2">Gestión de Categorías</h1>
                <p className="text-muted-foreground">
                  Administra las categorías de tus productos
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
                    Nueva Categoría
                  </>
                )}
              </Button>
            </div>

            {showAddForm && (
              <Card className="p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Crear Nueva Categoría</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-category">Nombre de la Categoría</Label>
                    <Input
                      id="new-category"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej: Electrónica, Ropa, Muebles..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !processing) {
                          handleCreate();
                        }
                      }}
                      disabled={processing !== null}
                    />
                  </div>
                  <div className="flex gap-2">
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
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setNewCategoryName("");
                      }}
                      disabled={processing !== null}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Información sobre categorías */}
            <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Sobre las categorías:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Las categorías vacías (sin productos) se pueden eliminar sin problemas</li>
                    <li>Al eliminar una categoría con productos, estos quedarán sin categoría asignada</li>
                    <li>Al renombrar una categoría, todos sus productos se actualizarán automáticamente</li>
                  </ul>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {categories.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      No hay categorías configuradas. Crea una nueva para organizar tus productos.
                    </p>
                    <Button onClick={() => setShowAddForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Categoría
                    </Button>
                  </div>
                </Card>
              ) : (
                categories.map((category) => (
                  <Card key={category.name} className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        {editingCategory === category.name ? (
                          <div className="space-y-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !processing) {
                                  handleUpdate(category.name, editValue);
                                } else if (e.key === 'Escape') {
                                  cancelEdit();
                                }
                              }}
                              disabled={processing !== null}
                              autoFocus
                            />
                            <p className="text-xs text-muted-foreground">
                              Presiona Enter para guardar, Escape para cancelar
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold text-lg">{category.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {category.count} producto{category.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {editingCategory === category.name ? (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdate(category.name, editValue)}
                              disabled={processing !== null}
                            >
                              {processing === category.name ? (
                                "..."
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={cancelEdit}
                              disabled={processing !== null}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(category.name)}
                              disabled={processing !== null}
                            >
                             <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(category.name, category.count)}
                              disabled={processing !== null}
                            >
                              {processing === category.name ? (
                                "..."
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
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

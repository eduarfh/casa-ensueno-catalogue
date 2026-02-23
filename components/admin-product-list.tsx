"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import AvailabilityFilter from "@/components/availability-filter";

interface ProductItem {
  id: string;
  name: string;
  price?: number | string | null;
  stock?: number;
  available?: boolean | number | string | null;
  // Preferimos product.category: string | null
  category?: string | null;
  // Backwards compatibility shapes
  categories?: { name?: string } | null;
  product_images?: Array<{ id: string; image_url: string }>;
  product_categories?: any; // legacy relational shape (optional)
}

interface ProductListProps {
  products: ProductItem[];
}

export function AdminProductList({ products }: ProductListProps) {
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [availableOnly, setAvailableOnly] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        let body = {};
        try {
          body = await response.json();
        } catch {}
        throw new Error((body as any).error || `HTTP ${response.status}`);
      }

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
      });

      // Refresh the current route so the list updates
      try {
        router.refresh();
      } catch (err) {
        // fallback: navigate to admin root
        console.warn("[AdminProductList] router.refresh failed, fallback to /admin", err);
        router.push("/admin");
      }

      setProductToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el producto",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar productos según disponibilidad
  const filteredProducts = useMemo(() => {
    if (!availableOnly) return products;
    return products.filter((p) => p.available === true || p.available === 1 || p.available === "1");
  }, [products, availableOnly]);

  const renderCategory = (product: ProductItem) => {
    // Prioridad:
    // 1) product.category (string)
    // 2) product.categories?.name (legacy)
    // 3) product.product_categories[0]?.categories?.name (legacy join)
    const catFromCategoryField = typeof product.category === "string" && product.category.trim() ? product.category.trim() : null;
    const catFromCategoriesObj = product.categories && (product.categories as any).name ? (product.categories as any).name : null;

    let catFromProductCategories = null;
    try {
      if (Array.isArray(product.product_categories) && product.product_categories.length > 0) {
        const first = product.product_categories[0];
        if (first && first.categories && first.categories.name) catFromProductCategories = first.categories.name;
      }
    } catch (err) {
      // ignore
    }

    return catFromCategoryField ?? catFromCategoriesObj ?? catFromProductCategories ?? null;
  };

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 border border-border rounded-lg p-6">
        <p className="text-lg text-muted-foreground mb-4">No hay productos aún</p>
        <Button asChild>
          <Link href="/admin/products/new">Crear primer producto</Link>
        </Button>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex-shrink-0">
            <AvailabilityFilter active={availableOnly} onChange={setAvailableOnly} />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-96 border border-border rounded-lg p-6">
          <p className="text-lg text-muted-foreground mb-4">No hay productos que coincidan con los filtros</p>
          <Button variant="outline" onClick={() => setAvailableOnly(false)}>
            Limpiar filtros
          </Button>
        </div>
      </div>
    );
  }

  // Cálculos de paginación
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = itemsPerPage === -1 
    ? filteredProducts 
    : filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset a la primera página
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <>
      <div className="space-y-4">
        {/* Controles de paginación superior */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mostrar:</span>
              <div className="flex gap-2">
                {[10, 15, 20, -1].map((value) => (
                  <Button
                    key={value}
                    variant={itemsPerPage === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleItemsPerPageChange(value)}
                    className="text-xs"
                  >
                    {value === -1 ? "Todos" : value}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              <AvailabilityFilter active={availableOnly} onChange={setAvailableOnly} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {itemsPerPage === -1 
              ? `${filteredProducts.length} productos` 
              : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredProducts.length)} de ${filteredProducts.length}`}
          </div>
        </div>

        {/* Tabla */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center min-w-[160px] whitespace-nowrap">Nombre</TableHead>
                  <TableHead className="text-center min-w-[140px] whitespace-nowrap">Categoría</TableHead>
                  <TableHead className="text-center min-w-[100px] whitespace-nowrap">Precio</TableHead>
                  <TableHead className="text-center min-w-[140px] whitespace-nowrap">Disponibilidad</TableHead>
                  <TableHead className="text-center min-w-[140px] whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedProducts.map((product) => {
                  const displayCategory = renderCategory(product);
                  const rawPrice =
                    typeof product.price === "number"
                      ? product.price
                      : typeof product.price === "string"
                      ? Number(product.price)
                      : Number(product.price ?? 0);
                  const safePrice = Number.isFinite(rawPrice) ? rawPrice : 0;

                  const isAvailable = product.available === true || product.available === 1 || product.available === "1";

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium whitespace-nowrap text-center">{product.name}</TableCell>

                      <TableCell className="whitespace-nowrap text-center">
                        {displayCategory ? (
                          <div className="flex justify-center">
                            <Badge variant="secondary">{displayCategory}</Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin categoría</span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-center">${safePrice.toFixed(2)}</TableCell>

                      <TableCell className="whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          {isAvailable ? (
                            <Badge variant="destructive" className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-800  dark:border  dark:hover:bg-emerald-500/30">
                              Disponible
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Agotado</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-center">
                        <div className="flex gap-2 justify-center">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/products/${product.id}`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive bg-transparent"
                            onClick={() => setProductToDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Controles de paginación inferior */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <div className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Eliminar Producto</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end mt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} disabled={isDeleting} className="bg-destructive">
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AdminProductList;

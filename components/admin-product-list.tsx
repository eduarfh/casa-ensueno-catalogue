"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import AvailabilityFilter from "@/components/availability-filter";

interface ProductItem {
  id: string;
  name: string;
  price?: number | string | null;
  stock?: number;
  available?: boolean | number | string | null;
  category?: string | null;
  categories?: { name?: string } | null;
  product_images?: Array<{ id: string; image_url: string }>;
  product_categories?: any;
}

interface ProductListProps {
  products: ProductItem[];
}

const STORAGE_KEY = 'admin-list-state';

type AdminListState = {
  search: string;
  page: number;
  perPage: number;
  available: boolean;
  scrollY: number;
};

function readAdminListState(): AdminListState | null {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<AdminListState>;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      search: typeof parsed.search === "string" ? parsed.search : "",
      page: Number.isFinite(parsed.page) ? Number(parsed.page) : 1,
      perPage: Number.isFinite(parsed.perPage) ? Number(parsed.perPage) : 10,
      available: Boolean(parsed.available),
      scrollY: Number.isFinite(parsed.scrollY) ? Number(parsed.scrollY) : 0,
    };
  } catch {
    return null;
  }
}

function writeAdminListState(search: string, page: number, perPage: number, available: boolean) {
  try {
    const state: AdminListState = {
      search,
      page,
      perPage,
      available,
      scrollY: window.scrollY,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignorar errores de sessionStorage en navegadores restringidos
  }
}

export function AdminProductList({ products }: ProductListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredState = useRef(false);
  
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Leer desde URL params (se actualizará cuando cambien los params)
  const urlPage = parseInt(searchParams.get("page") || "1");
  const urlPerPage = parseInt(searchParams.get("perPage") || "10");
  const urlAvailable = searchParams.get("available") === "true";
  const urlSearch = searchParams.get("search") || "";
  
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [itemsPerPage, setItemsPerPage] = useState(urlPerPage);
  const [availableOnly, setAvailableOnly] = useState(urlAvailable);
  
  const { toast } = useToast();

  // Restaurar estado al montar si venimos del detalle del producto
  useEffect(() => {
    if (hasRestoredState.current) return;
    hasRestoredState.current = true;

    if (typeof window === "undefined") return;

    const savedState = readAdminListState();
    if (!savedState) {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      return;
    }

    const nextParams = new URLSearchParams(window.location.search);

    if (savedState.search) {
      nextParams.set("search", savedState.search);
    } else {
      nextParams.delete("search");
    }

    if (savedState.page > 1) {
      nextParams.set("page", String(savedState.page));
    } else {
      nextParams.delete("page");
    }

    if (savedState.perPage !== 10) {
      nextParams.set("perPage", String(savedState.perPage));
    } else {
      nextParams.delete("perPage");
    }

    if (savedState.available) {
      nextParams.set("available", "true");
    } else {
      nextParams.delete("available");
    }

    const finalUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    const currentUrl = `${pathname}${window.location.search ? `?${window.location.search.slice(1)}` : ""}`;

    if (finalUrl !== currentUrl) {
      router.replace(finalUrl, { scroll: false });
    }

    setCurrentPage(savedState.page);
    setItemsPerPage(savedState.perPage);
    setAvailableOnly(savedState.available);

    setTimeout(() => {
      window.scrollTo({ top: savedState.scrollY, behavior: "auto" });
      sessionStorage.removeItem(STORAGE_KEY);
    }, 120);
  }, [pathname, router]);

  // Sincronizar estado con URL cuando cambian los searchParams (ej. navegación del navegador)
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1");
    const urlPerPage = parseInt(searchParams.get("perPage") || "10");
    const urlAvailable = searchParams.get("available") === "true";
    
    console.log('[AdminProductList] Syncing from URL:', { urlPage, urlPerPage, urlAvailable, currentPage, itemsPerPage, availableOnly });
    
    if (urlPage !== currentPage) setCurrentPage(urlPage);
    if (urlPerPage !== itemsPerPage) setItemsPerPage(urlPerPage);
    if (urlAvailable !== availableOnly) setAvailableOnly(urlAvailable);
  }, [searchParams]); // Omitimos los estados intencionalmente para evitar loops

  // Actualizar URL cuando cambien los filtros
  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Pequeño delay para evitar múltiples actualizaciones
    timeoutRef.current = setTimeout(() => {
      const currentParams = new URLSearchParams(window.location.search);
      
      // Mantener el search param si existe
      const currentSearch = currentParams.get("search");
      if (currentSearch) {
        currentParams.set("search", currentSearch);
      }
      
      // Leer valores actuales de la URL
      const urlPage = parseInt(currentParams.get("page") || "1");
      const urlPerPage = parseInt(currentParams.get("perPage") || "10");
      const urlAvailable = currentParams.get("available") === "true";
      
      // Solo actualizar si realmente cambió
      let needsUpdate = false;
      
      if (currentPage !== urlPage) {
        if (currentPage > 1) {
          currentParams.set("page", currentPage.toString());
        } else {
          currentParams.delete("page");
        }
        needsUpdate = true;
      }
      
      if (itemsPerPage !== urlPerPage) {
        if (itemsPerPage !== 10) {
          currentParams.set("perPage", itemsPerPage.toString());
        } else {
          currentParams.delete("perPage");
        }
        needsUpdate = true;
      }
      
      if (availableOnly !== urlAvailable) {
        if (availableOnly) {
          currentParams.set("available", "true");
        } else {
          currentParams.delete("available");
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const newUrl = currentParams.toString() 
          ? `${pathname}?${currentParams.toString()}` 
          : pathname;
        
        router.replace(newUrl, { scroll: false });
      }
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPage, itemsPerPage, availableOnly, pathname, router]);

  // Función para guardar scroll antes de navegar
  const handleNavigateToProduct = (productId: string) => {
    writeAdminListState(urlSearch, currentPage, itemsPerPage, availableOnly);
    router.push(`/admin/products/${productId}`);
  };

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

      router.refresh();
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
    setCurrentPage(1);
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleNavigateToProduct(product.id)}
                          >
                            <Edit className="w-4 h-4" />
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

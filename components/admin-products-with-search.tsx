"use client";

import React, { useState, useMemo } from "react";
import { AdminProductList } from "@/components/admin-product-list";
import { AdminProductSearch } from "@/components/admin-product-search";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ProductImage = { id: string; image_url: string; display_order?: number };
type CategoryObj = { name?: string } | null;

type ProductItemLocal = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  stock?: number;
  available?: boolean | number | string | null;
  category?: string | null;
  categories?: CategoryObj;
  product_images?: ProductImage[];
  product_categories?: any;
};

interface AdminProductsWithSearchProps {
  products: ProductItemLocal[];
}

export function AdminProductsWithSearch({ products }: AdminProductsWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();
    return products.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(query);
      const descriptionMatch = product.description?.toLowerCase().includes(query);
      const categoryMatch = product.category?.toLowerCase().includes(query);
      
      return nameMatch || descriptionMatch || categoryMatch;
    });
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <AdminProductSearch 
          onSearch={setSearchQuery}
          placeholder="Buscar por nombre, descripción o categoría..."
        />

        <Button variant="outline" size="sm">
          <Link href="/admin/products/new" className="text-xs sm:text-sm font-medium transition-colors px-2 py-1">
            Crear Producto
          </Link>
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {searchQuery ? (
          <>
            Mostrando {filteredProducts.length} de {products.length} productos
            {filteredProducts.length === 0 && (
              <span className="ml-2 text-destructive">
                - No se encontraron resultados para "{searchQuery}"
              </span>
            )}
          </>
        ) : (
          `Total de productos: ${products.length}`
        )}
      </div>

      <AdminProductList products={filteredProducts} />
    </div>
  );
}

// lib/products.ts
export interface Product {
  id: string
  name: string
  price?: number | null
  available?: boolean | null
  image?: string | null
  /**
   * category: nombre de la categoría para el filtro.
   * Si un producto tiene varias categorías, en este ejemplo usamos la primera.
   */
  category?: string | null
}

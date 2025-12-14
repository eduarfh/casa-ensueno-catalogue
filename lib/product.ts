// lib/products.ts
export interface Product {
  id: string
  name: string
  price?: number | null
  available?: boolean | null
  image?: string | null
  category?: string | null
}

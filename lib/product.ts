export interface Product {
  id: string;
  name: string;
  price?: number | null;
  available?: boolean | null;
  images?: string[] | null;
  category?: string | null;
}

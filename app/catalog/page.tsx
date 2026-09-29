import SiteHeader from "@/components/site-header";
import { query } from "@/lib/db";
import CatalogClient from "@/components/catalog-client";
import StoreInfo from "@/components/store-info";
import CatalogLoading from "./loading";
import { getStoragePublicUrl } from "@/lib/storage-utils";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  // Traer productos + imágenes + monedas (servidor)
  let products: any[] = [];
  try {
    // Obtener productos con monedas
    const productsResult = await query(`
      SELECT 
        p.*,
        json_agg(
          json_build_object(
            'currency_id', c.id,
            'currency_code', c.code,
            'currency_symbol', c.symbol,
            'currency_name', c.name,
            'price', pc.price
          ) ORDER BY c.display_order
        ) FILTER (WHERE c.id IS NOT NULL) as currencies
      FROM products p
      LEFT JOIN product_currencies pc ON p.id = pc.product_id
      LEFT JOIN currencies c ON pc.currency_id = c.id AND c.is_active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    const dbProducts = productsResult.rows;

    // Obtener imágenes
    const imagesResult = await query('SELECT * FROM product_images ORDER BY display_order ASC');
    const dbImages = imagesResult.rows;

    products = (dbProducts || []).map((product: any) => {
      const productImages = (dbImages || [])
        .filter((img: any) => img.product_id === product.id)
        .map((img: any) => getStoragePublicUrl(img.image_url) ?? "")
        .filter(Boolean);

      // Normalizar price a number (si viene string), y proteger contra NaN
      const rawPrice = product.price ?? 0;
      const parsedPrice =
        typeof rawPrice === "string" && rawPrice.trim() !== "" ? parseFloat(rawPrice) : (rawPrice as number | undefined);
      const price = Number.isFinite(parsedPrice as number) ? (parsedPrice as number) : 0;

      // Normalizar available a boolean (campo explícito en products)
      const explicitAvailable = (product as any).available;
      let available = false;
      if (typeof explicitAvailable === "boolean") available = explicitAvailable;
      else if (typeof explicitAvailable === "string") {
        available = explicitAvailable === "1" || explicitAvailable.toLowerCase() === "true";
      } else {
        // Si no hay campo available, inferimos desde stock (si existe)
        available = (product.stock ?? 0) > 0;
      }

      return {
        id: product.id,
        name: product.name,
        category: product.category ?? "Sin categoría",
        price,
        description: product.description,
        stock: product.stock,
        images: productImages.length > 0 ? productImages : ["/placeholder.svg?height=300&width=300"],
        created_at: product.created_at,
        updated_at: product.updated_at,
        available,
        currencies: product.currencies || [],
      };
    });
  } catch (err) {
    console.error("[catalog] Failed to load products:", err);
    return <CatalogLoading />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Espaciador para compensar el header fixed */}
      <div className="h-24 sm:h-28 md:h-32" />
      <main className="container mx-auto px-1 sm:px-1 lg:px-1 py-8 sm:py-8">
        <CatalogClient products={products} />
        <footer className="mt-8">
          <StoreInfo />
        </footer>
      </main>
    </div>
  );
}

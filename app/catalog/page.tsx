import SiteHeader from "@/components/site-header";
import { createServerClient } from "@/lib/supabase/server";
import CatalogClient from "@/components/catalog-client";
import StoreInfo from "@/components/store-info";
import CatalogLoading from "./loading";
import { getStoragePublicUrl } from "@/lib/storage-utils";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const supabase = await createServerClient();

  // Traer productos + imágenes (servidor)
  let products: any[] = [];
  try {
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (productsError) {
      console.error("[catalog] Error fetching products:", productsError);
      return <CatalogLoading />;
    }

    const { data: dbImages, error: imagesError } = await supabase
      .from("product_images")
      .select("*")
      .order("display_order", { ascending: true });

    if (imagesError) {
      console.error("[catalog] Error fetching product images:", imagesError);
    }

    if (!dbProducts) {
      return <CatalogLoading />;
    }

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
      };
    });
  } catch (err) {
    console.error("[catalog] Failed to load products:", err);
    return <CatalogLoading />;
  }

  // Derivar lista única de categorías desde los productos
  const derivedCategories = Array.from(
    new Map(
      products
        .map((p) => {
          const name = (p.category ?? "Sin categoría").toString().trim() || "Sin categoría";
          return [name, { id: name, name }] as const;
        })
    ).values()
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-1 sm:px-1 lg:px-1 py-8 sm:py-8">
        <CatalogClient products={products} />
        <footer className="mt-8">
          <StoreInfo />
        </footer>
      </main>
    </div>
  );
}

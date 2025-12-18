// components/product-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Plus, Trash } from "lucide-react";
import Image from "next/image";

interface Category {
  id: string; // uuid
  name: string;
}

interface ProductFormProps {
  product?: any; // server data with product_categories relation
  categories: Category[]; // initial list passed from server (ids should be UUIDs)
}

export function ProductForm({ product, categories: initialCategories }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    available: product?.available ?? true,
    // product?.product_categories contains objects with category_id (uuid) or join; convert to uuid strings
    categories: (product?.product_categories?.map((pc: any) => String(pc.category_id || (pc.categories && pc.categories.id)) ) || []) as string[],
  });

  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const [images, setImages] = useState<{ id?: string; url: string; file?: File }[]>(
    product?.product_images
      ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      .map((img: any) => ({ id: img.id, url: img.image_url })) || []
  );

  const [uploadingImages, setUploadingImages] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: product?.name ?? prev.name,
      description: product?.description ?? prev.description,
      price: product?.price ?? prev.price,
      available: product?.available ?? prev.available,
      categories: (product?.product_categories?.map((pc: any) => String(pc.category_id || (pc.categories && pc.categories.id))) || prev.categories) as string[],
    }));
    setCategories(initialCategories || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, initialCategories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, checked, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : name === "available" ? checked : value,
    }));
  };

  const toggleCategory = (catId: string) => {
    setFormData((prev) => {
      const set = new Set(prev.categories);
      if (set.has(catId)) set.delete(catId);
      else set.add(catId);
      return { ...prev, categories: Array.from(set) };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = files.map((file) => ({ url: URL.createObjectURL(file), file }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Crear categoría inline ---
  const createCategory = async () => {
    try {
      const name = newCategoryName?.trim();
      if (!name) {
        toast({ title: "Nombre vacío", description: "Ingresa el nombre de la categoría", variant: "destructive" });
        return;
      }
      setCreatingCategory(true);

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin", // enviar cookies HTTP-only
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      // Preferir UUID (id) devuelto por el servidor
      const newCatId = data?.id ?? data?.uuid ?? null;
      if (!newCatId) {
        // servidor devolvió sólo id_int? eso es raro; pedimos recarga
        throw new Error("La categoría fue creada pero el servidor no devolvió su UUID. Recarga la página.");
      }
      const newCatName = data?.name ?? name;

      const newCat: Category = { id: String(newCatId), name: newCatName };

      // add to local categories & select it
      setCategories((prev) => [...prev, newCat]);
      setFormData((prev) => ({ ...prev, categories: Array.from(new Set([...prev.categories, newCat.id])) }));
      setNewCategoryName("");
      toast({ title: "Categoría creada", description: `Categoría "${newCat.name}" creada con éxito` });

      // If editing an existing product, create the product_categories relation immediately
      if (product?.id) {
        try {
          const assocRes = await fetch(`/api/products/${product.id}/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ category_id: newCat.id }),
          });

          const assocJson = await assocRes.json().catch(() => ({}));
          if (!assocRes.ok) {
            console.warn("[createCategory] association failed:", assocJson);
            toast({ title: "Asociación fallida", description: "La categoría se creó pero no se asoció al producto. Intenta guardarlo.", variant: "destructive" });
          } else {
            toast({ title: "Asociación creada", description: `La categoría se asoció al producto` });
          }
        } catch (e) {
          console.error("[createCategory] error creating product-category association:", e);
        }
      }
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudo crear la categoría", variant: "destructive" });
      console.error("[createCategory] ", err);
    } finally {
      setCreatingCategory(false);
    }
  };

  // --- Eliminar categoría (global) ---
  const deleteCategory = async (catId: string) => {
    try {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) return;

      const ok = window.confirm(`¿Eliminar la categoría "${cat.name}"? Esto fallará si la categoría está asociada a productos.`);
      if (!ok) return;

      setDeletingCategoryId(catId);

      const res = await fetch(`/api/categories/${catId}`, {
        method: "DELETE",
        credentials: "same-origin", // enviar cookies HTTP-only
      });

      let payload: any = null;
      const text = await res.text();
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        console.warn("[deleteCategory] response not JSON, body:", text);
        if (!res.ok) {
          toast({
            title: "Error eliminando categoría",
            description: text || `HTTP ${res.status}`,
            variant: "destructive",
          });
          return;
        } else {
          setCategories((prev) => prev.filter((c) => c.id !== catId));
          setFormData((prev) => ({ ...prev, categories: prev.categories.filter((id) => id !== catId) }));
          toast({ title: "Categoría eliminada", description: `Categoría "${cat.name}" eliminada` });
          return;
        }
      }

      if (!res.ok) {
        const errMsg = payload?.error || payload?.message || `HTTP ${res.status}`;
        toast({ title: "Error eliminando categoría", description: errMsg, variant: "destructive" });
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setFormData((prev) => ({ ...prev, categories: prev.categories.filter((id) => id !== catId) }));
      toast({ title: "Categoría eliminada", description: `Categoría "${cat.name}" eliminada` });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudo eliminar la categoría", variant: "destructive" });
      console.error("[deleteCategory] ", err);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  // --- Submit product ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // upload new images to /api/upload
      const uploadedImages: { url: string; display_order: number }[] = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.id && !image.file) {
          uploadedImages.push({ url: image.url, display_order: i });
          continue;
        }
        if (image.file) {
          setUploadingImages((prev) => [...prev, i]);
          const fd = new FormData();
          fd.append("file", image.file);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
          if (!uploadRes.ok) throw new Error("Error al subir la imagen");
          const data = await uploadRes.json();
          uploadedImages.push({ url: data.url, display_order: i });
          setUploadingImages((prev) => prev.filter((idx) => idx !== i));
        }
      }

      // Validate categories: allow UUID or numeric id_int strings
      const categoriesPayload = formData.categories.map((cid) => String(cid));
      const uuidOrInt = (s: string) => (/^\d+$/.test(s) || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s));
      if (!categoriesPayload.every(c => uuidOrInt(c))) {
        throw new Error("Una o más categorías tienen formato inválido. Recarga la página y vuelve a intentarlo.");
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        available: formData.available,
        categories: categoriesPayload, // array of uuid or id_int strings (server will resolve)
        images: uploadedImages,
      };

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin", // enviar cookies si endpoint requiere auth
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || error.message || "Error al guardar el producto");
      }

      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: product ? "El producto se ha actualizado correctamente" : "El producto se ha creado correctamente",
      });

      router.push("/admin");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el producto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Producto</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: Lámpara" required disabled={isSubmitting} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe el producto..." rows={4} disabled={isSubmitting} />
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="price">Precio ($)</Label>
            <Input id="price" name="price" type="number" step="0.01" value={String(formData.price)} onChange={handleInputChange} placeholder="0.00" required disabled={isSubmitting} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="available">Disponible</Label>
            <div className="flex items-center gap-3">
              <input id="available" name="available" type="checkbox" checked={formData.available} onChange={handleInputChange} disabled={isSubmitting} className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Marcar si el producto está disponible para la venta</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categories">Categorías</Label>

          <div className="flex gap-2 items-center mb-3">
            <Input
              placeholder="Nueva categoría (ej. Sala)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={creatingCategory}
            />
            <Button type="button" onClick={createCategory} disabled={creatingCategory || !newCategoryName.trim()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {creatingCategory ? "Creando..." : "Crear"}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded">
            {categories.map((cat) => {
              const selected = formData.categories.includes(cat.id);
              const deleting = deletingCategoryId === cat.id;
              return (
                <div key={cat.id} className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCategory(cat.id)}
                      disabled={isSubmitting}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    disabled={deleting}
                    title="Eliminar categoría"
                    className="text-destructive hover:text-destructive/80 p-1 rounded"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Imágenes del Producto</h3>

        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Haz clic para subir imágenes</span>
          </div>
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={isSubmitting} className="hidden" />
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image src={image.url || "/placeholder.svg"} alt={`Product image ${index + 1}`} fill className="object-cover" />
                  {uploadingImages.includes(index) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" disabled={isSubmitting}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.name || formData.categories.length === 0}>
          {isSubmitting ? "Guardando..." : product ? "Actualizar Producto" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}

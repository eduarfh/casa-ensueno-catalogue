// components/ProductForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Upload } from "lucide-react";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  product?: any; // server data with product_categories relation
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    available: product?.available ?? true,
    categories: product?.product_categories?.map((pc: any) => pc.category_id) || [],
  });

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
    // keep form in sync if product prop changes
    setFormData((prev) => ({
      ...prev,
      name: product?.name ?? prev.name,
      description: product?.description ?? prev.description,
      price: product?.price ?? prev.price,
      available: product?.available ?? prev.available,
      categories: product?.product_categories?.map((pc: any) => pc.category_id) || prev.categories,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
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
          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
          if (!uploadRes.ok) throw new Error("Error al subir la imagen");
          const data = await uploadRes.json();
          uploadedImages.push({ url: data.url, display_order: i });
          setUploadingImages((prev) => prev.filter((idx) => idx !== i));
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        available: formData.available,
        categories: formData.categories,
        images: uploadedImages,
      };

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar el producto");
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
            <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="0.00" required disabled={isSubmitting} />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded">
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2">
                <input type="checkbox" checked={formData.categories.includes(cat.id)} onChange={() => toggleCategory(cat.id)} disabled={isSubmitting} />
                <span className="text-sm">{cat.name}</span>
              </label>
            ))}
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

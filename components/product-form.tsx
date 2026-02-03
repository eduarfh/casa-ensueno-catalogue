// components/product-form.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, ChevronDown } from "lucide-react";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
};

interface ProductFormProps {
  product?: any; // server data (product.category: string)
  categories?: (Category | string)[]; // lista inicial desde server (opcional)
}

export function ProductForm({ product, categories: initialCategories = [] }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price ?? 0,
    available: product?.available ?? true,
    category: product?.category ?? "",
  });

  const normalizedFromProp = useMemo(() => {
    return (initialCategories || [])
      .map((c) => {
        if (!c) return null;
        if (typeof c === "string") return { id: c, name: c } as Category;
        return { id: String((c as Category).id), name: String((c as Category).name) } as Category;
      })
      .filter(Boolean) as Category[];
  }, [initialCategories]);

  const [categories, setCategories] = useState<Category[]>(normalizedFromProp);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Combobox / inline creation states
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const [customCategoryName, setCustomCategoryName] = useState("");
  const [creatingCategoryLocally, setCreatingCategoryLocally] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const [images, setImages] = useState<{ id?: string; url: string; file?: File }[]>(
    product?.product_images
      ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      .map((img: any) => ({ id: img.id, url: img.image_url })) || []
  );
  const [uploadingImages, setUploadingImages] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_BYTES_CLIENT = 500 * 1024; // 500KB

  // Inicializar categorías desde el prop y desde la API (categorías únicas en products)
  useEffect(() => {
    setCategories(normalizedFromProp);
    // si product tiene categoría, la pre-selecciono (mantengo tu lógica)
    const prodCat = product?.category ?? null;
    if (prodCat) {
      const prodCatStr = String(prodCat).trim();
      if (!prodCatStr) {
        setSelectedCategoryId(null);
      } else {
        const found = normalizedFromProp.find((c) => String(c.name).toLowerCase() === prodCatStr.toLowerCase());
        if (found) {
          setSelectedCategoryId(String(found.id));
          setFormData((prev) => ({ ...prev, category: found.name }));
        } else {
          // synthetic
          setSelectedCategoryId(prodCatStr);
          setFormData((prev) => ({ ...prev, category: prodCatStr }));
          setCategories((prev) => {
            if (prev.find((p) => String(p.id) === prodCatStr)) return prev;
            return [...prev, { id: prodCatStr, name: prodCatStr }];
          });
        }
      }
    } else {
      setSelectedCategoryId(null);
      setFormData((prev) => ({ ...prev, category: "" }));
    }

    setFormData((prev) => ({
      ...prev,
      name: product?.name ?? prev.name,
      description: product?.description ?? prev.description,
      price: product?.price ?? prev.price,
      available: product?.available ?? prev.available,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, normalizedFromProp]);

  // Fetch categorías únicas desde products (server-side) al montar
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/products?onlyCategories=1", { credentials: "same-origin" });
        if (!res.ok) {
          // no obligo error visible, solo log
          console.warn("[ProductForm] no se pudieron obtener categorías: ", await res.text().catch(() => ""));
          return;
        }
        const data = await res.json().catch(() => ({}));
        const remoteCats: string[] = Array.isArray(data?.categories) ? data.categories : [];
        if (!mounted) return;
        setCategories((prev) => {
          const existingNames = new Set(prev.map((p) => p.name.toLowerCase()));
          const newCats: Category[] = [];
          for (const c of remoteCats) {
            if (!c) continue;
            if (!existingNames.has(String(c).toLowerCase())) {
              newCats.push({ id: String(c), name: String(c) });
              existingNames.add(String(c).toLowerCase());
            }
          }
          return [...prev, ...newCats];
        });
      } catch (err) {
        console.error("[ProductForm] fetch categories error:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // cerrar combobox si clic fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!comboboxRef.current) return;
      if (comboboxRef.current.contains(e.target as Node)) return;
      setComboOpen(false);
    }
    if (comboOpen) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [comboOpen]);

  const existingCategories = categories.map((c) => c.name);

  const handleSelectCategory = (catName: string) => {
    setFormData((prev) => ({ ...prev, category: catName }));
    // buscar id existente (case-insensitive)
    const found = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
    if (found) {
      setSelectedCategoryId(String(found.id));
    } else {
      // synthetic id = name
      const syntheticId = catName;
      setSelectedCategoryId(syntheticId);
      setCategories((prev) => {
        if (prev.find((p) => String(p.id) === syntheticId)) return prev;
        return [...prev, { id: syntheticId, name: catName }];
      });
    }
    setComboOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : name === "available" ? checked : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const accepted: { id?: string; url: string; file?: File }[] = [];
    for (const f of files) {
      if (typeof f.size === "number" && f.size > MAX_BYTES_CLIENT) {
        toast({
          title: "Imagen demasiado grande",
          description: `La imagen "${f.name}" supera el límite de ${Math.round(MAX_BYTES_CLIENT / 1024)} KB.`,
          variant: "destructive",
        });
        continue;
      }
      accepted.push({ url: URL.createObjectURL(f), file: f });
    }
    if (accepted.length) setImages((prev) => [...prev, ...accepted]);
    if (e.target) e.target.value = "";
  };

  const removeImage = (index: number) => setImages((prev) => prev.filter((_, i) => i !== index));

  // Crear categoría *localmente* (no persistir en la tabla categories)
  const createLocalCategory = () => {
    const name = (customCategoryName || formData.category || "").trim();
    if (!name) {
      toast({ title: "Nombre vacío", description: "Ingresa el nombre de la categoría", variant: "destructive" });
      return;
    }
    setCreatingCategoryLocally(true);
    try {
      const syntheticId = name;
      setCategories((prev) => {
        // prevenir duplicados por nombre (case-insensitive)
        if (prev.find((p) => p.name.toLowerCase() === name.toLowerCase())) return prev;
        return [...prev, { id: syntheticId, name }];
      });
      setSelectedCategoryId(syntheticId);
      setFormData((prev) => ({ ...prev, category: name }));
      setIsCustomCategory(false);
      setCustomCategoryName("");
      toast({
        title: "Categoría añadida al formulario",
        description: `La categoría "${name}" será enviada al crear el producto.`,
      });
    } catch (err) {
      console.error("[createLocalCategory]", err);
      toast({ title: "Error", description: "No se pudo crear la categoría localmente", variant: "destructive" });
    } finally {
      setCreatingCategoryLocally(false);
    }
  };

  // Eliminar categoría remota (sigue siendo opcional; si la tabla categories existe y tienes endpoint)
  const deleteCategory = async (catId: string) => {
    try {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) return;
      if (!window.confirm(`¿Eliminar la categoría "${cat.name}"? Esto fallará si la categoría está asociada a productos.`)) return;
      setDeletingCategoryId(catId);

      const res = await fetch(`/api/categories/${catId}`, { method: "DELETE", credentials: "same-origin" });
      const text = await res.text();
      if (!res.ok) {
        toast({ title: "Error eliminando categoría", description: text || `HTTP ${res.status}`, variant: "destructive" });
        return;
      }

      setCategories((prev) => prev.filter((c) => c.id !== catId));
      if (selectedCategoryId === catId) {
        setSelectedCategoryId(null);
        setFormData((prev) => ({ ...prev, category: "" }));
      }
      toast({ title: "Categoría eliminada", description: `Categoría "${cat.name}" eliminada` });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudo eliminar la categoría", variant: "destructive" });
      console.error("[deleteCategory]", err);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const uploadedImages: { url?: string; path?: string; display_order: number }[] = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.id && !image.file) {
          uploadedImages.push({ url: image.url, display_order: i });
          continue;
        }
        if (image.file) {
          if (typeof image.file.size === "number" && image.file.size > MAX_BYTES_CLIENT) {
            const msg = `La imagen "${image.file.name}" supera el tamaño máximo permitido de ${Math.round(MAX_BYTES_CLIENT / 1024)} KB.`;
            toast({ title: "Imagen muy grande", description: msg, variant: "destructive" });
            throw new Error(msg);
          }

          setUploadingImages((prev) => [...prev, i]);
          const fd = new FormData();
          fd.append("file", image.file);

          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd, credentials: "same-origin" });
          const data = await uploadRes.json().catch(() => ({}));
          if (!uploadRes.ok) {
            const serverMsg = data?.error || data?.details || `HTTP ${uploadRes.status}`;
            toast({ title: "Error al subir imagen", description: serverMsg, variant: "destructive" });
            setUploadingImages((prev) => prev.filter((idx) => idx !== i));
            throw new Error(serverMsg);
          }
          if (!data?.url) {
            const serverMsg = data?.error || data?.details || "No se recibió URL de la imagen subida";
            toast({ title: "Error al subir imagen", description: serverMsg, variant: "destructive" });
            setUploadingImages((prev) => prev.filter((idx) => idx !== i));
            throw new Error(serverMsg);
          }
          uploadedImages.push({ url: data.url, display_order: i });
          setUploadingImages((prev) => prev.filter((idx) => idx !== i));
        }
      }

      // Permitir tanto selectedCategoryId (id o synthetic) como texto en formData.category cuando se usa custom
      if (!selectedCategoryId && !formData.category) throw new Error("Selecciona o crea una categoría para el producto.");

      const categoryPayload = formData.category ? formData.category : selectedCategoryId ?? formData.category;

      const payload: any = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        available: formData.available,
        category: categoryPayload,
        images: uploadedImages,
      };

      const url = product ? `/api/products/${product.id}` : "/api/products";
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "same-origin",
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
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudo guardar el producto", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setUploadingImages([]);
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
              <span className="text-sm text-muted-foreground">Marcar si está disponible</span>
            </div>
          </div>
        </div>

        {/* ====== NUEVA SECCIÓN DE CATEGORÍA (combobox + crear inline LOCAL) ====== */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="category">Categoría</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCustomCategory((s) => !s);
                setFormData((prev) => ({ ...prev, category: "" }));
                setSelectedCategoryId(null);
              }}
              className="text-xs"
            >
              {isCustomCategory ? "Seleccionar existente" : "Crear nueva"}
            </Button>
          </div>

          {isCustomCategory ? (
            <div className="flex gap-2 items-center">
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, category: e.target.value }));
                  setCustomCategoryName(e.target.value);
                }}
                placeholder="Escribe una nueva categoría"
                required
              />
              {/* Guardar localmente en el formulario (no persiste en DB hasta crear el producto) */}
              <Button type="button" onClick={createLocalCategory} disabled={creatingCategoryLocally || !String(formData.category).trim()}>
                {creatingCategoryLocally ? "Guardando..." : "Añadir"}
              </Button>
            </div>
          ) : (
            <div ref={comboboxRef} className="relative">
              <div className="relative">
                <Input
                  id="category"
                  value={formData.category}
                  readOnly
                  onClick={() => setComboOpen((s) => !s)}
                  placeholder="Selecciona una categoría"
                  aria-haspopup="listbox"
                  aria-expanded={comboOpen}
                  className="cursor-pointer pr-10"
                />
                <button
                  type="button"
                  onClick={() => setComboOpen((s) => !s)}
                  aria-hidden
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <ChevronDown className="opacity-70" size={18} />
                </button>
              </div>

              {comboOpen && (
                <ul
                  ref={listRef}
                  role="listbox"
                  aria-label="Categorías"
                  className="absolute z-50 mt-2 w-full max-h-60 overflow-auto rounded-lg border bg-white dark:bg-slate-900 shadow-lg p-1 dark:border-slate-700"
                >
                  {existingCategories.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No hay categorías</li>
                  ) : (
                    existingCategories.map((cat) => (
                      <li
                        key={cat}
                        role="option"
                        aria-selected={formData.category === cat}
                        onClick={() => handleSelectCategory(cat)}
                        className={`px-3 py-2 rounded cursor-pointer text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${formData.category === cat ? "bg-slate-50 dark:bg-slate-800 font-medium" : ""}`}
                      >
                        {cat}
                      </li>
                    ))
                  )}
                </ul>
              )}

              <input type="hidden" name="category" value={formData.category} />
            </div>
          )}
        </div>
        {/* ====== FIN SECCIÓN CATEGORÍA ====== */}
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Imágenes del Producto</h3>

        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Haz clic para subir imágenes</span>
            <span className="text-xs text-muted-foreground">Máx {Math.round(MAX_BYTES_CLIENT / 1024)} KB por imagen</span>
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
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isSubmitting}
                >
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
        <Button type="submit" disabled={isSubmitting || !formData.name || (!selectedCategoryId && !formData.category)}>
          {isSubmitting ? "Guardando..." : product ? "Actualizar Producto" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;

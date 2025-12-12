// components/ui/product-card.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { X, Upload } from "lucide-react"
import Image from "next/image"

interface ProductFormProps {
  product?: {
    id: string
    name: string
    description: string | null
    price: number
    stock: number
    available: boolean
    category_id: string | null
    product_images: Array<{ id: string; image_url: string; display_order: number | null }>
  }
  categories: Array<{ id: string; name: string }>
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    category_id: product?.category_id || "",
  })

  const [images, setImages] = useState<{ id?: string; url: string; file?: File }[]>(
    product?.product_images
      ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((img) => ({
        id: img.id,
        url: img.image_url,
      })) || [],
  )

  const [uploadingImages, setUploadingImages] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category_id: value,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const newImages = files.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }))

    setImages((prev) => [...prev, ...newImages])
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Upload new images to Blob and get URLs
      const uploadedImages: { url: string; display_order: number }[] = []

      for (let i = 0; i < images.length; i++) {
        const image = images[i]

        // Skip existing images
        if (image.id && !image.file) {
          uploadedImages.push({ url: image.url, display_order: i })
          continue
        }

        if (image.file) {
          setUploadingImages((prev) => [...prev, i])

          const formDataImage = new FormData()
          formDataImage.append("file", image.file)

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formDataImage,
          })

          if (!uploadResponse.ok) {
            throw new Error("Error al subir la imagen")
          }

          const uploadedData = await uploadResponse.json()
          uploadedImages.push({
            url: uploadedData.url,
            display_order: i,
          })

          setUploadingImages((prev) => prev.filter((idx) => idx !== i))
        }
      }

      // Save product
      const productData = {
        ...formData,
        images: uploadedImages,
      }

      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error al guardar el producto")
      }

      const result = await response.json()

      toast({
        title: product ? "Producto actualizado" : "Producto creado",
        description: product ? "El producto se ha actualizado correctamente" : "El producto se ha creado correctamente",
      })

      router.push("/admin")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el producto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Producto</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Ej: Lámpara de escritorio"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe el producto..."
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Precio ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="0"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category_id} onValueChange={handleSelectChange} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Imágenes del Producto</h3>

        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Haz clic para subir imágenes</span>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isSubmitting}
            className="hidden"
          />
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={image.url || "/placeholder.svg"}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
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
        <Button type="submit" disabled={isSubmitting || !formData.name || !formData.category_id}>
          {isSubmitting ? "Guardando..." : product ? "Actualizar Producto" : "Crear Producto"}
        </Button>
      </div>
    </form>
  )
}

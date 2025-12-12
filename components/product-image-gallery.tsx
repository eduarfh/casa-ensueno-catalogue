"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ProductImageGalleryProps {
  images: Array<{ id: string; url: string }>
}

export function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const currentImage = images[selectedIndex]

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (!images.length) {
    return (
      <div className="bg-muted aspect-square rounded-lg flex items-center justify-center border border-border">
        <p className="text-muted-foreground">Sin imágenes disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative bg-white aspect-square rounded-lg overflow-hidden group shadow-md border border-border">
        <Image
          src={currentImage?.url || "/placeholder.svg"}
          alt="Product image"
          fill
          className="object-cover"
          priority
        />

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white/90 hover:bg-white shadow-md"
              onClick={goToPrevious}
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all bg-white/90 hover:bg-white shadow-md"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </Button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:shadow-md ${
                selectedIndex === index ? "border-primary shadow-md" : "border-border hover:border-primary/50"
              }`}
            >
              <Image
                src={image.url || "/placeholder.svg"}
                alt={`Product thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

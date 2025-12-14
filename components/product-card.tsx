// components/ProductCard.tsx (o wherever it lives)
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Share2, MessageCircle } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image: string
  available: boolean
  disponibilidad: number
}

export function ProductCard({ id, name, price, image, available, disponibilidad }: ProductCardProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    setIsSharing(true)
    const productUrl = `${window.location.origin}/product/${id}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: `Mira este producto: ${name} - $${price}`,
          url: productUrl,
        })
      } else {
        await navigator.clipboard.writeText(productUrl)
        toast({
          title: "Enlace copiado",
          description: "El enlace del producto ha sido copiado al portapapeles",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola, me interesa el producto: ${name} - $${price}`)
    const whatsappUrl = `https://wa.me/5352490476?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/50 bg-card group">
      <Link href={`/product/${id}`} className="block relative overflow-hidden bg-muted aspect-square">
        <Image
          src={image || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {!available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Badge className="text-base sm:text-lg py-1.5 px-4 bg-destructive hover:bg-destructive shadow-lg">
              Agotado
            </Badge>
          </div>
        )}
      </Link>

      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors">
            <Link href={`/product/${id}`}>{name}</Link>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {disponibilidad > 0 ? `${disponibilidad} disponibles` : "Sin stock"}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xl sm:text-2xl font-bold text-primary">${price.toFixed(2)}</span>
        </div>

        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm"
            disabled={!available}
            onClick={(e) => {
              if (!available) e.preventDefault()
            }}
          >
            <Link href={`/product/${id}`}>Ver Detalles</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            disabled={isSharing}
            className="hover:border-secondary hover:text-secondary hover:bg-secondary/10 transition-all bg-transparent"
            title="Compartir producto"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsApp}
            className="hover:border-accent hover:text-accent hover:bg-accent/10 transition-all bg-transparent"
            title="Contactar por WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

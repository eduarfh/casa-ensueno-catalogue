"use client"

import { Button } from "@/components/ui/button"
import { Share2, MessageCircle, Copy } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ProductShareButtonsProps {
  productUrl: string
  productName: string
  productPrice: number
}

export function ProductShareButtons({ productUrl, productName, productPrice }: ProductShareButtonsProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink()
      return
    }

    setIsSharing(true)
    try {
      await navigator.share({
        title: productName,
        text: `Mira este producto: ${productName} - $${productPrice}`,
        url: productUrl,
      })
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error sharing:", error)
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl)
      toast({
        title: "Enlace copiado",
        description: "El enlace del producto ha sido copiado al portapapeles",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      })
    }
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, me interesa este producto: ${productName}\n$${productPrice}\n${productUrl}`,
    )
    const whatsappUrl = `https://wa.me/5352490476?text=${message}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="space-y-4 border-t border-border pt-6">
      <h3 className="font-semibold text-lg">Compartir Producto</h3>
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleNativeShare}
          disabled={isSharing}
          className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartir
        </Button>
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="flex-1 sm:flex-none bg-white hover:bg-muted border-border hover:border-secondary hover:text-secondary transition-colors"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar Enlace
        </Button>
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="flex-1 sm:flex-none bg-white hover:bg-accent/10 border-border hover:border-accent hover:text-accent transition-colors"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
      </div>
    </div>
  )
}

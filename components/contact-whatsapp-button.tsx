// components/contact-whatsapp-button.tsx
"use client";
import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  productName?: string;
  price?: string | number;
  productUrl?: string;
  image?: string | null;
}

export default function ContactWhatsAppButton({
  productName,
  price,
  productUrl,
  image,
}: Props) {
  const handleClick = () => {
    // Dispara el mismo evento que espera tu modal
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("open-whatsapp-contacts", {
        detail: {
          productName,
          price: typeof price === "number" ? price.toFixed(2) : price,
          url: productUrl,
          image,
        },
      })
    );
  };

  return (
    <Button onClick={handleClick} variant="secondary">
      Contactar por WhatsApp
    </Button>
  );
}

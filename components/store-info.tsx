"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Phone, MapPin, Map } from "lucide-react";
import { FacebookIcon, GmailIcon, InstagramIcon } from "./icons";
import { WhatsAppSVG } from "./svgs";

type StoreInfoRow = {
  id?: string | null;
  label?: string | null;
  phone_display?: string | null;
  whatsapp_number?: string | null;
  address?: string | null;
  lat?: string | null;
  lng?: string | null;
  hours?: string | null;
};

export default function StoreInfo() {
  const [store, setStore] = useState<StoreInfoRow>({
    label: "",
    phone_display: "",
    whatsapp_number: "",
    address: "",
    lat: "",
    lng: "",
    hours: "",
  });

  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        // Agregar timestamp para evitar caché
        const timestamp = new Date().getTime();
        const res = await fetch(`/api/store-info?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (!mounted) return;
        if (!res.ok) {
          console.error("Failed to fetch /api/store-info:", res.status, await res.text());
          return;
        }
        const data = await res.json();
        if (data && typeof data === "object") {
          setStore((s) => ({ ...s, ...data }));
        }
      } catch (err) {
        console.error("Error loading store info:", err);
      }
    };

    load();

    const onUpdated = () => load();
    window.addEventListener("store-info:updated", onUpdated);

    try {
      const ua = navigator.userAgent || (window as any).opera || "";
      const isiOS = /iPhone|iPad|iPod/.test(ua);
      const isAndroid = /Android/.test(ua);
      if (isiOS) setPlatform("ios");
      else if (isAndroid) setPlatform("android");
      else setPlatform("desktop");
    } catch {
      setPlatform("desktop");
    }

    return () => {
      mounted = false;
      window.removeEventListener("store-info:updated", onUpdated);
    };
  }, []);

  const address = store.address ?? "Calle 68 entre 9na y 11na, Miramar, Playa";
  const lat = store.lat ?? "23.106806";
  const lng = store.lng ?? "-82.431900";

  // --- Developer credit UI ---
  const devName = "Ing. Eduardo Fonseca";
  const devWhatsRaw = "5355550301";
  const devWhatsDisplay = "+53 55550301";
  const devWhatsLink = `https://wa.me/${devWhatsRaw}?text=${encodeURIComponent("Hola Eduardo, te contacto desde la web.")}`;
  const instagramLink = "https://instagram.com/eduar_fh";
  const facebookLink = "https://www.facebook.com/eduardoenrique.fonsecaheredia?mibextid=wwXIfr&mibextid=wwXIfr";
  const mailLink = "mailto:fonsecaeduar136@gmail.com";

  const buildMapsLink = () => {
    const label = encodeURIComponent(store.label ?? "Casa Ensueño");
    
    if (platform === "ios") {
      // Apple Maps en iOS - usa el esquema maps://
      // Formato: maps://?q=lat,lng o maps://?ll=lat,lng&q=nombre
      return `maps://?ll=${lat},${lng}&q=${label}`;
    }
    
    if (platform === "android") {
      // Google Maps en Android - usa el esquema geo:
      // Formato: geo:lat,lng?q=lat,lng(nombre)
      return `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    }
    
    // Desktop o fallback - abre Google Maps en el navegador
    // Formato: https://www.google.com/maps/search/?api=1&query=lat,lng
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const openMaps = () => {
    const url = buildMapsLink();

    // Para iOS y Android, intentar abrir la app nativa
    if (platform === "ios" || platform === "android") {
      try {
        // Crear un enlace temporal y hacer clic
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        
        // Limpiar después de un momento
        setTimeout(() => {
          a.remove();
        }, 100);
      } catch (error) {
        console.error("Error opening maps:", error);
        // Fallback: abrir Google Maps en navegador
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener,noreferrer");
      }
    } else {
      // Desktop: abrir en nueva pestaña
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const openContactsModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-whatsapp-contacts", { detail: {} }));
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copiado al portapapeles");
    } catch (e) {
      console.error("Clipboard error", e);
      alert("No se pudo copiar. Selecciona y copia manualmente.");
    }
  };

  return (
    <section className="container mx-auto px-1 py-4">
      <Card className="border-1">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Visítanos o contáctanos</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          {/* Horario */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-[#eab308]/20">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horario</p>
                <p className="font-semibold text-foreground">{store.hours}</p>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="flex flex-col gap-3">

            <div className="inline-flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-[#059669]/20">
                <Phone className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contactos</p>
                <Button onClick={openContactsModal} variant="outline" className="text-sm bg-transparent dark:bg-[#059669]/20">
                  Ver contactos
                </Button>
              </div>
            </div>
          </div>

          {/* Dirección + Mapa */}
          <div className="flex flex-col gap-3">
            <div className="inline-flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-[#dc2626]/20">
                <MapPin className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-semibold text-foreground">{address}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordenadas: {lat}, {lng}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={openMaps}
                variant="outline"
                className="flex-1 inline-flex items-center justify-center gap-2 dark:bg-[#dc2626]/20"
                aria-label="Abrir ubicación en la app de mapas"
              >
                <Map className="w-5 h-5" />

                <span className="font-medium">
                  {platform === "ios" 
                    ? "Abrir en Apple Maps" 
                    : platform === "android" 
                    ? "Abrir en Google Maps" 
                    : "Ver en Google Maps"}
                </span>
              </Button>
            </div>
          </div>

          
        </CardContent>
      </Card>
      {/* Footer / Créditos */}
      <div className="container justify-center mx-auto px-1 py-4">
        <div className="col-span-full mt-6 pt-4 border-t border-muted/20">
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">Desarrollado por</div>
                <div className="font-semibold text-lg text-foreground mb-3">{devName}</div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <a 
                  href={devWhatsLink} 
                  target="_blank" 
                  rel="noreferrer noopener" 
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="WhatsApp"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" aria-hidden>
                    {WhatsAppSVG}
                  </span>
                  <span>{devWhatsDisplay}</span>
                </a>

                <a 
                  href={instagramLink} 
                  target="_blank" 
                  rel="noreferrer noopener" 
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Instagram"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" aria-hidden>
                    <InstagramIcon />
                  </span>
                  <span className="hidden sm:inline">@eduar_fh</span>
                </a>

                <a 
                  href={facebookLink} 
                  target="_blank" 
                  rel="noreferrer noopener" 
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Facebook"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" aria-hidden>
                    <FacebookIcon />
                  </span>
                  <span className="hidden sm:inline">Facebook</span>
                </a>

                <a 
                  href={mailLink} 
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Email"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" aria-hidden>
                    <GmailIcon />
                  </span>
                  <span className="hidden sm:inline">fonsecaeduar136@gmail.com</span>
                </a>
              </div>
            </div>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Casa Ensueño. Todos los derechos reservados.
            </div>
          </div>
      </div>
          
    </section>
  );
}

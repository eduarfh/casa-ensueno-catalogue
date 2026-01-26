"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Phone, MapPin, Map } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { FacebookIcon, GmailIcon, InstagramIcon } from "./icons";
import { WhatsAppSVG } from "./svgs";
import { createPortal } from "react-dom";

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
    label: "Dulces Sueños",
    phone_display: "+53 59158599",
    whatsapp_number: "5359158599",
    address: "Calle 68 entre 9na y 11na, Miramar, Playa",
    lat: "23.106806",
    lng: "-82.431900",
    hours: "Lun / Sáb • 10:00 am / 6:00 pm",
  });

  const [platform, setPlatform] = useState<"ios" | "android" | "desktop" | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/store-info");
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
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
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

  const phoneDisplay = store.phone_display ?? "+53 59158599";
  const whatsappNumberClean = (store.whatsapp_number ?? "5359158599").replace(/\D/g, "");
  const whatsappLink = `https://wa.me/${whatsappNumberClean}?text=${encodeURIComponent(
    "Hola Gabriela, quiero consultar sobre un producto del catálogo"
  )}`;

  const telLink = `tel:${(phoneDisplay || "").replace(/\s+/g, "")}`;

  const address = store.address ?? "Calle 68 entre 9na y 11na, Miramar, Playa";
  const lat = store.lat ?? "23.106806";
  const lng = store.lng ?? "-82.431900";

  // --- Developer credit UI ---
  const devName = "Eduardo Enrique Fonseca Heredia";
  const devWhatsRaw = "5355550301";
  const devWhatsDisplay = "+53 55550301";
  const devWhatsLink = `https://wa.me/${devWhatsRaw}?text=${encodeURIComponent("Hola Eduardo, te contacto desde la web.")}`;
  const instagramLink = "https://instagram.com/eduar_fh";
  const facebookLink = "https://www.facebook.com/eduardoenrique.fonsecaheredia?mibextid=wwXIfr&mibextid=wwXIfr";
  const mailLink = "mailto:fonsecaeduar136@gmail.com";

  const [showDevContact, setShowDevContact] = useState(false);
  const devButtonRef = useRef<HTMLButtonElement | null>(null);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);

  const calculateCoords = () => {
    const btn = devButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    const top = rect.bottom + scrollY + 8;
    const preferredLeft = rect.left + scrollX;
    const menuWidth = 260;
    let left = preferredLeft;
    if (left + menuWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - menuWidth - 8);
    }
    setPopoverCoords({ top, left });
  };

  const toggleDevPopover = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowDevContact((prev) => {
      const next = !prev;
      if (next) setTimeout(() => calculateCoords(), 0);
      return next;
    });
  };

  useEffect(() => {
    if (!showDevContact) return;

    const onOutsideClick = (ev: MouseEvent) => {
      const portalEl = document.getElementById("dev-contact-popover");
      if (!portalEl) {
        setShowDevContact(false);
        return;
      }
      if (devButtonRef.current && devButtonRef.current.contains(ev.target as Node)) return;
      if (!portalEl.contains(ev.target as Node)) {
        setShowDevContact(false);
      }
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setShowDevContact(false);
    };

    const onScrollOrResize = () => calculateCoords();

    document.addEventListener("click", onOutsideClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("click", onOutsideClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDevContact]);

  const devPortal =
    popoverCoords && showDevContact ? (
      <div
        id="dev-contact-popover"
        style={{
          position: "absolute",
          top: popoverCoords.top,
          left: popoverCoords.left,
          zIndex: 99999,
          minWidth: 200,
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="false"
      >
        <div
          className="inline-flex items-center gap-3 rounded-md px-3 py-2 text-sm"
          style={{
            background: "var(--color-popover, var(--color-card, #fff))",
            color: "var(--color-popover-foreground, var(--color-foreground, #111))",
            border: "1px solid var(--color-border, rgba(0,0,0,0.06))",
            boxShadow: "0 8px 24px rgba(2,6,23,0.08)",
          }}
        >
          <span className="inline-flex items-center justify-center w-6 h-6" aria-hidden>
            {WhatsAppSVG}
          </span>

          <a
            href={devWhatsLink}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring,rgba(34,197,94,0.3))] rounded"
          >
            {devWhatsDisplay}
          </a>
        </div>
      </div>
    ) : null;

  const buildMapsLink = () => {
    const label = store.label ?? "Dulces Sueños";
    if (platform === "ios") {
      return `maps://?q=${encodeURIComponent(`${lat},${lng}`)}`;
    }
    if (platform === "android") {
      return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  const openMaps = () => {
    const url = buildMapsLink();

    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.location.href = url;
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
                aria-label="Abrir en la app de mapas"
              >
                <Map className="w-5 h-5" />

                <span className="font-medium">
                  Abrir en {platform === null ? "Maps" : platform === "ios" ? "Apple Maps" : platform === "android" ? "Google Maps" : "Maps"}
                </span>
              </Button>
            </div>
          </div>

          {/* Footer / Créditos */}
          <div className="col-span-full mt-6 pt-4 border-t border-muted/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-sm text-[var(--color-muted-foreground,rgba(0,0,0,0.6))]">Desarrollado por</div>

                <button
                  ref={devButtonRef}
                  onClick={toggleDevPopover}
                  aria-expanded={showDevContact}
                  aria-controls="dev-contact-popover"
                  className="font-medium text-[var(--color-foreground,#111)] hover:text-[var(--color-foreground,#111)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring,rgba(34,197,94,0.2))] rounded"
                  title="Contactar al desarrollador"
                >
                  {devName}
                </button>

                {typeof document !== "undefined" && devPortal ? createPortal(devPortal, document.body) : null}
              </div>

              <div className="flex items-center gap-3">
                <a href={instagramLink} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground,rgba(0,0,0,0.6))] hover:text-[var(--color-foreground,#111)] transition-colors">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" aria-hidden>
                    <InstagramIcon />
                  </span>
                  <span className="hidden sm:inline">Instagram</span>
                </a>

                <a href={facebookLink} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground,rgba(0,0,0,0.6))] hover:text-[var(--color-foreground,#111)] transition-colors">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" aria-hidden>
                    <FacebookIcon />
                  </span>
                  <span className="hidden sm:inline">Facebook</span>
                </a>

                <a href={mailLink} className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground,rgba(0,0,0,0.6))] hover:text-[var(--color-foreground,#111)] transition-colors">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-md" aria-hidden>
                    <GmailIcon />
                  </span>
                  <span className="hidden sm:inline">fonsecaeduar136@gmail.com</span>
                </a>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">© {new Date().getFullYear()} Dulces Sueños. Todos los derechos reservados.</div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

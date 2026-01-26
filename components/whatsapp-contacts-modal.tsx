// components/whatsapp-contacts-modal.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type Contact = { id: string; name: string; phone: string; store_id?: string | null };
type ModalContext = {
  productName?: string;
  price?: string;
  url?: string;
  image?: string;
} | null;

export default function WhatsAppContactsModal() {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<ModalContext>(null);
  const [defaultCountryCode, setDefaultCountryCode] = useState<string | null>(null);

  // portal container
  const portalElRef = useRef<HTMLDivElement | null>(null);
  if (!portalElRef.current && typeof document !== "undefined") {
    portalElRef.current = document.createElement("div");
  }

  useEffect(() => {
    if (!portalElRef.current) return;
    document.body.appendChild(portalElRef.current);
    return () => {
      if (portalElRef.current && document.body.contains(portalElRef.current)) {
        document.body.removeChild(portalElRef.current);
      }
    };
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store-whatsapp");
      if (!res.ok) {
        setContacts([]);
        return;
      }
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("fetch contacts error", e);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // intentar deducir country code desde store-info (heurística)
  const fetchStoreDefaultCountry = async () => {
    try {
      const res = await fetch("/api/store-info");
      if (!res.ok) return null;
      const data = await res.json();
      const maybe = (data?.whatsapp_number ?? data?.phone_display ?? "") as string;
      const cleaned = (maybe || "").replace(/\D/g, "");
      if (!cleaned) return null;
      // devolver 1..3 dígitos iniciales
      return cleaned.slice(0, Math.min(3, cleaned.length));
    } catch (e) {
      console.warn("No se pudo obtener store-info para country code:", e);
      return null;
    }
  };

  useEffect(() => {
    const handler = (ev: Event) => {
      const d = (ev as CustomEvent)?.detail ?? {};
      setContext({
        productName: d.productName,
        price: d.price,
        url: d.url,
        image: d.image,
      });
      setOpen(true);
      fetchContacts();
      fetchStoreDefaultCountry().then((c) => {
        if (c) setDefaultCountryCode(c);
        else setDefaultCountryCode("53");
      });
    };
    window.addEventListener("open-whatsapp-contacts", handler as EventListener);
    return () => window.removeEventListener("open-whatsapp-contacts", handler as EventListener);
  }, []);

  // cerrar con Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const normalizePhoneForWa = (rawPhone: string) => {
    if (!rawPhone) return null;
    let clean = rawPhone.replace(/\D/g, "");
    if (clean.startsWith("00")) clean = clean.replace(/^0+/, "");
    const defaultCode = defaultCountryCode ?? "53";
    // si ya empieza con +country (removimos +), ya estará presente
    if (clean.startsWith(defaultCode)) return clean;
    if (clean.length <= 8) return `${defaultCode}${clean}`;
    if (clean.length >= 9 && clean.length <= 15) return clean;
    return `${defaultCode}${clean}`;
  };

  const buildMsg = (contact: Contact) => {
    const pname = context?.productName ? `${context.productName}` : "";
    const price = context?.price ? ` - $${context.price}` : "";
    const link = context?.url ? `\n\nVer: ${context.url}` : "";
    // WhatsApp preview will be generated from the URL's OG metadata; incluir link es suficiente
    const base = `Hola ${contact.name}, me interesa${pname ? `: ${pname}` : ""}${price}.${link}`;
    return encodeURIComponent(base);
  };

  const openWa = (phone: string, contact: Contact) => {
    const normalized = normalizePhoneForWa(phone ?? "");
    if (!normalized) {
      console.warn("Número inválido para WhatsApp:", phone);
      alert("Número inválido o desconocido para este contacto.");
      return;
    }
    const msg = buildMsg(contact);
    const url = `https://wa.me/${normalized}?text=${msg}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  // Si no abierto o portal no creado, no renderizamos
  if (!open || !portalElRef.current) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4"
      aria-hidden={!open}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(false);
        }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-lg shadow-lg overflow-hidden z-[10000] bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="font-semibold">Contactos de WhatsApp</h3>
              {context?.productName ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Consultar por <strong>{context.productName}</strong>
                  {context?.price ? ` — $${context.price}` : null}
                </p>
              ) : null}
            </div>

            <div className="ml-3 flex items-start gap-2">
              {context?.image ? (
                <img
                  src={context.image}
                  alt={context.productName ?? "Producto"}
                  className="w-16 h-16 object-cover rounded-md border"
                />
              ) : null}
              <button
                onClick={() => setOpen(false)}
                className="text-sm opacity-70"
                aria-label="Cerrar modal contactos WhatsApp"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {loading ? <div className="text-sm">Cargando...</div> : null}
          {!loading && contacts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No hay contactos.</div>
          ) : null}

          <ul className="space-y-3">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.phone}</div>
                </div>
                <Button size="sm" onClick={() => openWa(c.phone, c)}>
                  Chatear
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, portalElRef.current);
}

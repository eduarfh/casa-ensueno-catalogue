// components/admin/store-form.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";

type StoreInfoRow = {
  id?: string | null;
  label?: string | null;
  phone_display?: string | null;
  whatsapp_number?: string | null;
  address?: string | null;
  lat?: string | null;
  lng?: string | null;
  hours?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function AdminStoreForm() {
  const [form, setForm] = useState<StoreInfoRow>({
    label: "Casa Ensueño",
    phone_display: "+53 5 2490476",
    whatsapp_number: "53592490476",
    address: "7ma A / 44 A y 46 Miramar, Municipio Playa, La Habana",
    lat: "23.08099",
    lng: "-82.48791",
    hours: "Lun / Sáb • 10:00 am - 6:00 pm",
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/store-info");
        if (!mounted) return;
        if (!res.ok) {
          console.error("Failed to load store-info:", await res.text());
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data) setForm((s) => ({ ...s, ...data }));
      } catch (err) {
        console.error("Error loading store-info:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    const onUpdated = () => load();
    window.addEventListener("store-info:updated", onUpdated);
    return () => {
      mounted = false;
      window.removeEventListener("store-info:updated", onUpdated);
    };
  }, []);

  const handleChange = (k: keyof StoreInfoRow, v: string) => {
    setForm((s) => ({ ...s, [k]: v }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        id: form.id ?? undefined,
        label: form.label ?? "",
        phone_display: form.phone_display ?? "",
        whatsapp_number: form.whatsapp_number ?? "",
        address: form.address ?? "",
        lat: form.lat ?? "",
        lng: form.lng ?? "",
        hours: form.hours ?? "",
      };

      // LLAMADA AL ENDPOINT SERVER-SIDE (no enviamos secretos desde el cliente)
      const res = await fetch("/api/admin/save-store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // si ocurre 401/500/otro lo mostramos y devolvemos el body para debug
        const text = await res.text().catch(() => "");
        console.error("Save failed:", res.status, text);
        notify("error", "Error al guardar la información.");
        return;
      }

      const data = await res.json();
      if (data) {
        setForm((s) => ({ ...s, ...data }));
      }
      notify("success", "Información guardada.");
      window.dispatchEvent(new Event("store-info:updated"));
    } catch (err) {
      console.error("handleSave unexpected:", err);
      notify("error", "Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle>Configuración de la tienda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Etiqueta (nombre)</span>
            <input className="input" value={form.label ?? ""} onChange={(e) => handleChange("label", e.target.value)} disabled={loading} />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Teléfono (mostrar)</span>
            <input className="input" value={form.phone_display ?? ""} onChange={(e) => handleChange("phone_display", e.target.value)} disabled={loading} />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">WhatsApp (sin + ni espacios)</span>
            <input className="input" value={form.whatsapp_number ?? ""} onChange={(e) => handleChange("whatsapp_number", e.target.value)} disabled={loading} />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Horario (texto)</span>
            <input className="input" value={form.hours ?? ""} onChange={(e) => handleChange("hours", e.target.value)} disabled={loading} />
          </label>

          <label className="flex flex-col md:col-span-2">
            <span className="text-xs text-muted-foreground mb-1">Dirección</span>
            <input className="input" value={form.address ?? ""} onChange={(e) => handleChange("address", e.target.value)} disabled={loading} />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Lat</span>
            <input className="input" value={form.lat ?? ""} onChange={(e) => handleChange("lat", e.target.value)} disabled={loading} />
          </label>

          <label className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Lng</span>
            <input className="input" value={form.lng ?? ""} onChange={(e) => handleChange("lng", e.target.value)} disabled={loading} />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch("/api/store-info");
                if (res.ok) {
                  const data = await res.json();
                  if (data) setForm(data);
                }
              } catch (err) {
                console.error("Error reloading store-info:", err);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || saving}
          >
            Restaurar valores
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

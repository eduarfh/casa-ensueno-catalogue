"use client";
import React, { useEffect, useId, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import AdminStoreWhatsApp from "./admin-store-whatsapp";

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

type FieldErrors = Partial<Record<keyof StoreInfoRow, string>>;

export default function AdminStoreForm() {
  const id = useId();

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
  const [showWhatsAppManager, setShowWhatsAppManager] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/store-info");
        if (!mounted) return;
        if (!res.ok) {
          console.error("Failed to load store-info:", await res.text());
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
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Validaciones ligeras en cliente
  const validate = (payload: StoreInfoRow) => {
    const e: FieldErrors = {};
    if (!payload.label || payload.label.trim().length < 2) e.label = "La etiqueta es requerida.";
    if (payload.whatsapp_number && !/^\d{6,15}$/.test(payload.whatsapp_number)) {
      e.whatsapp_number = "El número de WhatsApp debe ser solo dígitos (6–15 caracteres).";
    }
    if (payload.lat && isNaN(Number(payload.lat))) e.lat = "Lat debe ser un número válido.";
    if (payload.lng && isNaN(Number(payload.lng))) e.lng = "Lng debe ser un número válido.";
    return e;
  };

  const handleSave = async () => {
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

    const clientErrors = validate(payload);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      // Enfocar el primer error (mejor experiencia accesible)
      const firstKey = Object.keys(clientErrors)[0] as keyof StoreInfoRow;
      const el = document.getElementById(`${id}-${firstKey}`);
      if (el) el.focus();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/save-store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("Save failed:", res.status, text);
        notify("error", "Error al guardar la información.");
        return;
      }

      const data = await res.json();
      if (data) setForm((s) => ({ ...s, ...data }));
      notify("success", "Información guardada.");
      window.dispatchEvent(new Event("store-info:updated"));
    } catch (err) {
      console.error("handleSave unexpected:", err);
      notify("error", "Ocurrió un error inesperado.");
    } finally {
      setSaving(false);
    }
  };

  const openContactsModalPreview = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-whatsapp-contacts", { detail: {} }));
    }
  };

  const reloadValues = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store-info");
      if (res.ok) {
        const data = await res.json();
        if (data) setForm(data);
        setErrors({});
      } else {
        console.error("Failed to reload store-info:", res.status);
      }
    } catch (err) {
      console.error("Error reloading store-info:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2" aria-busy={loading || saving}>
      <CardHeader>
        <CardTitle>Configuración de la tienda</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Form grid: responsive 1 / 2 / 3 columnas según ancho */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Label */}
          <div className="flex flex-col">
            <label htmlFor={`${id}-label`} className="text-xs text-muted-foreground mb-1">
              Etiqueta (nombre)
            </label>
            <input
              id={`${id}-label`}
              className="input"
              value={form.label ?? ""}
              onChange={(e) => handleChange("label", e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.label}
              aria-describedby={errors.label ? `${id}-label-error` : undefined}
            />
            {errors.label ? <p id={`${id}-label-error`} className="text-xs text-destructive mt-1">{errors.label}</p> : null}
          </div>

          {/* Phone display */}
          <div className="flex flex-col">
            <label htmlFor={`${id}-phone_display`} className="text-xs text-muted-foreground mb-1">
              Teléfono (mostrar)
            </label>
            <input
              id={`${id}-phone_display`}
              className="input"
              value={form.phone_display ?? ""}
              onChange={(e) => handleChange("phone_display", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col">
            <label htmlFor={`${id}-whatsapp_number`} className="text-xs text-muted-foreground mb-1">
              WhatsApp (solo dígitos, sin + ni espacios)
            </label>
            <input
              id={`${id}-whatsapp_number`}
              className="input"
              inputMode="numeric"
              value={form.whatsapp_number ?? ""}
              onChange={(e) => handleChange("whatsapp_number", e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              aria-invalid={!!errors.whatsapp_number}
              aria-describedby={errors.whatsapp_number ? `${id}-whatsapp-error` : undefined}
            />
            {errors.whatsapp_number ? <p id={`${id}-whatsapp-error`} className="text-xs text-destructive mt-1">{errors.whatsapp_number}</p> : null}
            <div className="mt-2 flex gap-2">
              {/* Preview contacts modal action (small, optional) */}
              <Button size="sm" variant="ghost" onClick={openContactsModalPreview} disabled={loading || saving}>
                Ver contactos
              </Button>
            </div>
          </div>

          {/* Hours */}
          <div className="flex flex-col">
            <label htmlFor={`${id}-hours`} className="text-xs text-muted-foreground mb-1">
              Horario (texto)
            </label>
            <input
              id={`${id}-hours`}
              className="input"
              value={form.hours ?? ""}
              onChange={(e) => handleChange("hours", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Address full width at small and spans columns on larger screens */}
          <div className="flex flex-col sm:col-span-2 lg:col-span-3">
            <label htmlFor={`${id}-address`} className="text-xs text-muted-foreground mb-1">
              Dirección
            </label>
            <input
              id={`${id}-address`}
              className="input"
              value={form.address ?? ""}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Lat / Lng grouped: appear side-by-side on md+ */}
          <div className="flex flex-col">
            <label htmlFor={`${id}-lat`} className="text-xs text-muted-foreground mb-1">
              Lat
            </label>
            <input
              id={`${id}-lat`}
              className="input"
              value={form.lat ?? ""}
              onChange={(e) => handleChange("lat", e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.lat}
              aria-describedby={errors.lat ? `${id}-lat-error` : undefined}
            />
            {errors.lat ? <p id={`${id}-lat-error`} className="text-xs text-destructive mt-1">{errors.lat}</p> : null}
          </div>

          <div className="flex flex-col">
            <label htmlFor={`${id}-lng`} className="text-xs text-muted-foreground mb-1">
              Lng
            </label>
            <input
              id={`${id}-lng`}
              className="input"
              value={form.lng ?? ""}
              onChange={(e) => handleChange("lng", e.target.value)}
              disabled={loading}
              aria-invalid={!!errors.lng}
              aria-describedby={errors.lng ? `${id}-lng-error` : undefined}
            />
            {errors.lng ? <p id={`${id}-lng-error`} className="text-xs text-destructive mt-1">{errors.lng}</p> : null}
          </div>
        </div>

        {/* Buttons: column on small screens, row on md+ */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-start gap-2">
          <div className="flex-1 md:flex-none">
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              aria-disabled={saving || loading}
              className="w-full md:w-auto"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={reloadValues}
            disabled={loading || saving}
            aria-disabled={loading || saving}
            className="w-full md:w-auto"
          >
            Restaurar valores
          </Button>

          <Button
            onClick={() => setShowWhatsAppManager((v) => !v)}
            variant="secondary"
            aria-expanded={showWhatsAppManager}
            className="w-full md:w-auto"
          >
            {showWhatsAppManager ? "Cerrar gestor" : "Gestionar contactos"}
          </Button>
        </div>

        {showWhatsAppManager ? (
          <div className="mt-4">
            <AdminStoreWhatsApp />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Contact = { id?: string; name: string; phone: string };

export default function AdminStoreWhatsApp() {
  const [list, setList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Agregar timestamp para evitar caché
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/store-whatsapp?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (c: Contact) => {
    setSaving(true);
    try {
      if (c.id) {
        await fetch("/api/admin/store-whatsapp", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        });
      } else {
        await fetch("/api/admin/store-whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c),
        });
      }
      await load();
      setEditing(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm("Eliminar contacto?")) return;
    try {
      await fetch("/api/admin/store-whatsapp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="p-4 border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Contactos WhatsApp</h4>
        <Button onClick={() => setEditing({ name: "", phone: "" })} size="sm">Nuevo</Button>
      </div>

      {loading ? <div>Cargando...</div> : null}

      <ul className="space-y-2">
        {list.map((c) => (
          <li key={c.id} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.phone}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditing(c)}>Editar</Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>Eliminar</Button>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <div className="mt-4 p-3 border rounded">
          <label className="block">
            <div className="text-xs">Nombre</div>
            <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </label>
          <label className="block mt-2">
            <div className="text-xs">Teléfono (solo dígitos)</div>
            <input className="input" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
          </label>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => editing && handleSave(editing)} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StorageUsageCard() {
  const [loading, setLoading] = useState(true);
  const [percent, setPercent] = useState(0);
  const [usedFormatted, setUsedFormatted] = useState("0 B");
  const [capacityFormatted, setCapacityFormatted] = useState("1 GB");
  const [filesCount, setFilesCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // referencia para evitar overlaps de fetch
  const fetchingRef = useRef(false);
  // interval en ms
  const POLL_INTERVAL = 15000; // 15s (ajustable)

  const load = async (opts?: { signal?: AbortSignal }) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setError(null);
    try {
      setLoading(true);
      const res = await fetch("/api/storage/usage", { signal: opts?.signal });

      // Protegemos el parseo: si el servidor responde HTML (una página de error)
      // no intentamos hacer res.json() porque da "Unexpected token '<'".
      const contentType = (res.headers.get("content-type") || "").toLowerCase();

      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Error fetching storage usage");
        setPercent(Number(json.percent ?? 0));
        setUsedFormatted(json.usedFormatted ?? "0 B");
        setCapacityFormatted(json.capacityFormatted ?? "1 GB");
        setFilesCount(json.filesCount ?? null);
      } else {
        // Si no es JSON, obtener texto (puede ser HTML de error) y mostrar un error legible
        const text = await res.text();
        console.error("StorageUsageCard non-JSON response:", text);
        throw new Error(
          `Respuesta inesperada del servidor al obtener uso de almacenamiento. ${res.status} ${res.statusText}`
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // petición abortada: silencioso
      } else {
        console.error("StorageUsageCard load error:", err);
        setError(err?.message ?? String(err));
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    // carga inicial
    load({ signal: ac.signal });

    // polling periódico
    const id = setInterval(() => {
      load();
    }, POLL_INTERVAL);

    // escucha evento manual para refresh inmediato
    const onManual = () => {
      load();
    };
    window.addEventListener("storage:refresh", onManual);

    return () => {
      clearInterval(id);
      window.removeEventListener("storage:refresh", onManual);
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Uso de almacenamiento</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-muted-foreground">Supabase Bucket (Free, 1 GB)</div>
            <div className="text-base font-semibold text-foreground">
              {usedFormatted} / {capacityFormatted}
            </div>
            {filesCount !== null && <div className="text-xs text-muted-foreground">Archivos: {filesCount}</div>}
          </div>

          <div className="text-sm text-muted-foreground">{loading ? "..." : `${percent.toFixed(1)}%`}</div>
        </div>

        <div className="w-full bg-muted/30 dark:bg-muted/20 rounded-full h-3 overflow-hidden">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background:
                "linear-gradient(90deg, rgba(149,199,195,1) 0%, rgba(244,144,185,1) 50%, rgba(244,159,81,1) 100%)",
            }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              alert(
                "Para liberar espacio: elimina imágenes no usadas, revisa productos sin imágenes relevantes o elimina productos antiguos."
              )
            }
          >
            ¿Cómo liberar?
          </Button>
        </div>

        {error && <p className="mt-2 text-xs text-destructive">Error: {error}</p>}
      </CardContent>
    </Card>
  );
}

export default StorageUsageCard;

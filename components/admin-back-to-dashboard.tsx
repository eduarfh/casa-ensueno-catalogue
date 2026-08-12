"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

const STORAGE_KEY = "admin-list-state";

function writeAdminListState() {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (!existing) {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          search: "",
          page: 1,
          perPage: 10,
          available: false,
          scrollY: window.scrollY,
        })
      );
      return;
    }

    const parsed = JSON.parse(existing);
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        scrollY: window.scrollY,
      })
    );
  } catch {
    // Ignorar errores de sessionStorage en navegadores restringidos
  }
}

export function AdminBackToDashboard() {
  const router = useRouter();

  const handleBack = () => {
    writeAdminListState();
    router.push("/admin");
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      Volver al dashboard
    </button>
  );
}

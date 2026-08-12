"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminProductSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export function AdminProductSearch({ 
  onSearch, 
  placeholder = "Buscar productos...",
  initialValue = ""
}: AdminProductSearchProps) {
  const [query, setQuery] = useState(initialValue);

  // Sincronizar con initialValue cuando cambie (ej. navegación del navegador)
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

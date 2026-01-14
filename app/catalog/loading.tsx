// app/catalog/loading.tsx
import React from "react";
import SkeletonGrid from "@/components/skeleton-grid";
import SiteHeader from "@/components/site-header";

export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-6">
          <div className="h-8 w-56 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>

        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1 h-10 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="w-28 h-10 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>

        <SkeletonGrid columns={4} count={8} />
      </main>
    </div>
  );
}

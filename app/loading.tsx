// app/loading.tsx
// Server component: skeleton global
import React from "react";
import SkeletonGrid from "@/components/skeleton-grid";
import SiteHeader from "@/components/site-header";

export default function AppLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-8">
          <div className="h-8 w-48 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="mt-2 h-4 w-64 mx-auto rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        </div>

        <SkeletonGrid columns={4} count={8} />
      </main>
    </div>
  );
}

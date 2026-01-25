// app/product/[id]/loading.tsx
import React from "react";
import SiteHeader from "@/components/site-header";
import StoreInfo from "@/components/store-info";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8" role="status" aria-busy="true">
        {/* Back link skeleton */}
        <div className="mb-6">
          <div className="inline-block h-4 w-36 rounded-md bg-muted/40 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left - image gallery skeleton */}
          <div className="space-y-4">
            <div className="w-full h-[420px] rounded-lg bg-muted/40 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-16 w-16 rounded-md bg-muted/40 animate-pulse" />
              <div className="h-16 w-16 rounded-md bg-muted/40 animate-pulse" />
              <div className="h-16 w-16 rounded-md bg-muted/40 animate-pulse" />
            </div>
          </div>

          {/* Right - details skeleton */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="h-10 w-3/4 rounded-md bg-muted/40 animate-pulse mb-3" />
                </div>
              </div>

              <div className="flex items-baseline gap-3 py-4">
                <div className="h-10 w-40 rounded-md bg-primary/20 animate-pulse" />
                <div className="h-6 w-20 rounded-md bg-muted/40 animate-pulse" />
              </div>
            </div>

            <div className="p-5 bg-muted/50 border border-muted rounded-md">
              <h3 className="h-6 w-48 rounded-md bg-muted/40 animate-pulse mb-4" />

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="h-4 w-28 rounded-md bg-muted/40 animate-pulse" />
                  <dd className="h-4 w-24 rounded-md bg-muted/40 animate-pulse" />
                </div>

                <div className="flex justify-between items-center">
                  <dt className="h-4 w-28 rounded-md bg-muted/40 animate-pulse" />
                  <dd className="h-4 w-20 rounded-md bg-muted/40 animate-pulse" />
                </div>

                <div>
                  <dt className="h-4 w-36 rounded-md bg-muted/40 animate-pulse mb-2" />
                  <dd className="space-y-2">
                    <div className="h-3 w-full rounded-md bg-muted/40 animate-pulse" />
                    <div className="h-3 w-11/12 rounded-md bg-muted/40 animate-pulse" />
                    <div className="h-3 w-9/12 rounded-md bg-muted/40 animate-pulse" />
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-32 rounded-md bg-muted/40 animate-pulse" />
              <div className="h-10 w-32 rounded-md bg-muted/40 animate-pulse" />
            </div>
          </div>
        </div>
      </main>

      <footer>
        {/* Footer / store info skeleton (we keep real StoreInfo so footer layout matches) */}
        <div className="border-t border-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="h-10 w-48 rounded-md bg-muted/40 animate-pulse" />
            {/* If you prefer the real StoreInfo component rendered while loading, uncomment below and remove the skeleton above:
                <StoreInfo />
            */}
          </div>
        </div>
      </footer>
    </div>
  );
}

// components/skeleton-grid.tsx
"use client";
import React from "react";

interface Props {
  columns?: number;
  count?: number;
}

export default function SkeletonGrid({ columns = 4, count = 8 }: Props) {
  const items = new Array(count).fill(0);

  // tidy: small responsive grid using tailwind classes similar to your layout
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6" style={{ gridAutoRows: "1fr" }}>
        {items.map((_, i) => (
          <div key={i} className="flex flex-col h-full animate-pulse">
            <div className="w-full aspect-[4/3] rounded-md bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

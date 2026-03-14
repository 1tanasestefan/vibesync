"use client";

import React from "react";

export default function SkeletonCard({ lines = 5, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="skeleton w-10 h-10 rounded" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 rounded" style={{ width: `${65 + Math.random() * 30}%` }} />
              <div className="skeleton h-2.5 rounded" style={{ width: `${35 + Math.random() * 35}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

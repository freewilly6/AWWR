"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Post } from "@/lib/supabase";

export default function FeaturedJobCarousel({ jobs }: { jobs: Post[] }) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const recent = jobs.slice(0, 10);

  useEffect(() => {
    if (recent.length <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % recent.length);
        setFade(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [recent.length]);

  if (recent.length === 0) return null;

  const job = recent[index];

  return (
    <Link
      href={`/opportunities/${job.slug}`}
      className="block border border-gold-muted/20 hover:border-gold-muted/40 bg-charcoal-light hover:bg-charcoal-mid transition-colors duration-300 p-8 mb-10"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-gold-muted/40 text-[10px] tracking-[0.25em] uppercase">
          Featured Opportunity
        </span>
        <span className="text-offwhite/20 text-[10px] tracking-wide">
          {index + 1} / {recent.length}
        </span>
      </div>

      <div
        className={`transition-opacity duration-300 ${fade ? "opacity-100" : "opacity-0"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-heading text-gold text-xl sm:text-2xl mb-3">
              {job.title}
            </h3>
            <p className="text-offwhite/50 text-sm leading-relaxed line-clamp-2">
              {job.excerpt}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3 sm:min-w-[160px]">
            {job.location_region && (
              <span className="text-offwhite/30 text-xs tracking-[0.1em] uppercase">
                {job.location_region}
              </span>
            )}
            {job.salary && (
              <span className="text-gold text-xs tracking-[0.1em] uppercase">
                {job.salary}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

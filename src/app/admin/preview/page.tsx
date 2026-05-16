"use client";

import { useEffect, useState } from "react";

type PreviewData = {
  title: string;
  excerpt: string;
  body: string;
  post_type: "blog" | "job";
  job_category: string;
  location_region: string;
  salary: string;
  published_at: string;
};

const STORAGE_KEY = "admin_preview";

export default function AdminPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setError("No preview data found. Open Preview from the admin editor.");
        return;
      }
      setData(JSON.parse(raw) as PreviewData);
    } catch {
      setError("Could not read preview data.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-charcoal-light flex items-center justify-center px-6">
        <p className="text-offwhite/40 text-sm">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-charcoal-light flex items-center justify-center">
        <p className="text-offwhite/30 text-sm">Loading preview...</p>
      </div>
    );
  }

  const dateLabel = data.published_at
    ? new Date(data.published_at)
    : new Date();

  return (
    <div className="min-h-screen bg-charcoal-light pt-24 pb-16">
      <div className="fixed top-16 left-0 right-0 z-40 bg-gold/15 border-b border-gold/30 px-4 py-2 text-center backdrop-blur-sm">
        <span className="text-gold text-[10px] tracking-[0.25em] uppercase">
          Preview — not visible to the public
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-6">
        <article>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-gold mb-4">
            {data.title || "Untitled"}
          </h1>

          {data.salary && (
            <div className="mb-6">
              <span className="text-gold font-heading text-2xl font-bold tracking-wide">
                {data.salary}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-8 text-xs text-offwhite/30">
            <time>
              {dateLabel.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {data.job_category && (
              <span className="text-gold-muted tracking-[0.1em] uppercase">
                {data.job_category}
              </span>
            )}
            {data.location_region && <span>{data.location_region}</span>}
          </div>

          {data.excerpt && (
            <p className="text-offwhite/60 text-base italic border-l-2 border-gold-muted/30 pl-4 mb-8">
              {data.excerpt}
            </p>
          )}

          <div className="border-t border-gold-muted/15 pt-8">
            <div
              className="post-body text-offwhite/70 text-[15px]"
              dangerouslySetInnerHTML={{ __html: data.body || "" }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

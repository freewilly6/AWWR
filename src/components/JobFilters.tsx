"use client";

import { useState, useEffect, useCallback } from "react";
import { JOB_CATEGORIES, LOCATION_REGIONS, type Post } from "@/lib/supabase";
import { fetchFilteredJobs } from "@/lib/posts";
import Link from "next/link";

export default function JobFilters({
  initialPosts,
  initialCategory,
}: {
  initialPosts: Post[];
  initialCategory?: string;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      const results = await fetchFilteredJobs(
        selectedCategories,
        selectedRegions
      );
      setPosts(results);
    } catch {
      // Keep current posts on error
    }
    setLoading(false);
  }, [selectedCategories, selectedRegions]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <div>
      {/* Filters */}
      <div className="border border-gold-muted/20 bg-charcoal-light p-6 mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sector filters */}
          <div>
            <h3 className="text-gold text-xs tracking-[0.2em] uppercase mb-4 font-heading">
              Sector
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {JOB_CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="gold-checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span className="text-offwhite/60 group-hover:text-offwhite text-xs tracking-wide transition-colors">
                    {cat}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Location filters */}
          <div>
            <h3 className="text-gold text-xs tracking-[0.2em] uppercase mb-4 font-heading">
              Location
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {LOCATION_REGIONS.map((region) => (
                <label
                  key={region}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="gold-checkbox"
                    checked={selectedRegions.includes(region)}
                    onChange={() => toggleRegion(region)}
                  />
                  <span className="text-offwhite/60 group-hover:text-offwhite text-xs tracking-wide transition-colors">
                    {region}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-offwhite/30 text-sm text-center py-12">
          Loading opportunities...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-offwhite/30 text-sm text-center py-12 border border-gold-muted/10">
          No opportunities match your selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              href={`/opportunities/${post.slug}`}
              key={post.id}
              className="block border border-gold-muted/15 hover:border-gold-muted/30 bg-charcoal-light hover:bg-charcoal-mid transition-colors duration-300 p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-heading text-gold text-lg mb-2">
                    {post.title}
                  </h3>
                  <p className="text-offwhite/50 text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-3 sm:min-w-[160px]">
                  {post.job_category && (
                    <span className="text-gold-muted text-xs tracking-[0.1em] uppercase">
                      {post.job_category}
                    </span>
                  )}
                  {post.location_region && (
                    <span className="text-offwhite/30 text-xs">
                      {post.location_region}
                    </span>
                  )}
                  {post.salary && (
                    <span className="text-gold text-xs tracking-[0.1em] uppercase">
                      {post.salary}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

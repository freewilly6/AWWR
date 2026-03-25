"use client";

import { useState } from "react";
import { getSupabaseClient, JOB_CATEGORIES, LOCATION_REGIONS } from "@/lib/supabase";

export default function AdminPage() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    post_type: "blog" as "blog" | "job",
    job_category: "",
    location_region: "",
    status: "draft" as "draft" | "published",
    seo_title: "",
    meta_description: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: generateSlug(val),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      body: form.body,
      post_type: form.post_type,
      job_category: form.post_type === "job" ? form.job_category || null : null,
      location_region:
        form.post_type === "job" ? form.location_region || null : null,
      status: form.status,
      seo_title: form.seo_title || null,
      meta_description: form.meta_description || null,
      published_at:
        form.status === "published" ? new Date().toISOString() : null,
    };

    const { error } = await getSupabaseClient().from("posts").insert(payload);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Post created successfully.");
      setForm({
        title: "",
        slug: "",
        excerpt: "",
        body: "",
        post_type: "blog",
        job_category: "",
        location_region: "",
        status: "draft",
        seo_title: "",
        meta_description: "",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-charcoal pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-heading text-3xl font-bold text-gold mb-8">
          New Post
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Post Type
            </label>
            <div className="flex gap-6">
              {(["blog", "job"] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="post_type"
                    value={type}
                    checked={form.post_type === type}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, post_type: type }))
                    }
                    className="gold-checkbox"
                  />
                  <span className="text-offwhite/70 text-sm capitalize">
                    {type === "job" ? "Job Opportunity" : "Blog Article"}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Slug
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, slug: e.target.value }))
              }
              className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite/50 px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Excerpt
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, excerpt: e.target.value }))
              }
              rows={3}
              className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40 resize-y"
              required
            />
          </div>

          {/* SEO Fields */}
          <div className="border border-gold-muted/10 p-4 space-y-4">
            <p className="text-gold-muted/50 text-[10px] tracking-[0.2em] uppercase">
              SEO (optional — falls back to title and excerpt if left blank)
            </p>
            <div>
              <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                SEO Title
              </label>
              <input
                type="text"
                value={form.seo_title}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, seo_title: e.target.value }))
                }
                placeholder="Custom title for search engines"
                className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40 placeholder:text-offwhite/20"
              />
            </div>
            <div>
              <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                Meta Description
              </label>
              <textarea
                value={form.meta_description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    meta_description: e.target.value,
                  }))
                }
                rows={2}
                placeholder="Custom description for search engine results"
                className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40 resize-y placeholder:text-offwhite/20"
              />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Body (HTML)
            </label>
            <textarea
              value={form.body}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, body: e.target.value }))
              }
              rows={12}
              className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm font-mono focus:outline-none focus:border-gold-muted/40 resize-y"
              required
            />
          </div>

          {/* Job-specific fields */}
          {form.post_type === "job" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border border-gold-muted/10 p-4">
              <div>
                <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                  Job Category
                </label>
                <select
                  value={form.job_category}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      job_category: e.target.value,
                    }))
                  }
                  className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
                >
                  <option value="">Select category</option>
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                  Location Region
                </label>
                <select
                  value={form.location_region}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      location_region: e.target.value,
                    }))
                  }
                  className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
                >
                  <option value="">Select region</option>
                  {LOCATION_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Status
            </label>
            <div className="flex gap-6">
              {(["draft", "published"] as const).map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={form.status === status}
                    onChange={() =>
                      setForm((prev) => ({ ...prev, status }))
                    }
                    className="gold-checkbox"
                  />
                  <span className="text-offwhite/70 text-sm capitalize">
                    {status}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-8 py-3 text-xs tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Create Post"}
          </button>

          {message && (
            <p
              className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400/70"}`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

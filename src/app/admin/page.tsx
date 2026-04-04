"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSupabaseClient,
  JOB_CATEGORIES,
  LOCATION_REGIONS,
  type Post,
} from "@/lib/supabase";
import AdminAuth from "@/components/AdminAuth";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gold-muted/20 bg-charcoal-mid h-[340px] flex items-center justify-center">
      <span className="text-offwhite/20 text-xs">Loading editor...</span>
    </div>
  ),
});

type FormData = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  post_type: "blog" | "job";
  job_category: string;
  location_region: string;
  salary: string;
  status: "draft" | "published";
  seo_title: string;
  meta_description: string;
};

const emptyForm: FormData = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  post_type: "blog",
  job_category: "",
  location_region: "",
  salary: "",
  status: "draft",
  seo_title: "",
  meta_description: "",
};

type View = "list" | "create" | "edit";

function AdminContent() {
  const [view, setView] = useState<View>("list");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "blog" | "job">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: editingId ? prev.slug : generateSlug(val),
    }));
  };

  const startCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
    setView("create");
  };

  const startEdit = (post: Post) => {
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      post_type: post.post_type,
      job_category: post.job_category || "",
      location_region: post.location_region || "",
      salary: post.salary || "",
      status: post.status,
      seo_title: post.seo_title || "",
      meta_description: post.meta_description || "",
    });
    setEditingId(post.id);
    setMessage("");
    setView("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const supabase = getSupabaseClient();

    const payload = {
      title: form.title,
      slug: generateSlug(form.slug),
      excerpt: form.excerpt,
      body: form.body,
      post_type: form.post_type,
      job_category:
        form.post_type === "job" ? form.job_category || null : null,
      location_region:
        form.post_type === "job" ? form.location_region || null : null,
      salary:
        form.post_type === "job" ? form.salary || null : null,
      status: form.status,
      seo_title: form.seo_title || null,
      meta_description: form.meta_description || null,
      published_at:
        form.status === "published" ? new Date().toISOString() : null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", editingId));
    } else {
      ({ error } = await supabase.from("posts").insert(payload));
    }

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(editingId ? "Post updated." : "Post created.");
      await loadPosts();
      setTimeout(() => {
        setView("list");
        setMessage("");
      }, 1000);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setConfirmDelete(null);
      await loadPosts();
    }
  };

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.post_type === filter);

  // ── List view ──
  if (view === "list") {
    return (
      <div className="min-h-screen bg-charcoal pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-heading text-3xl font-semibold text-gold">
              Posts
            </h1>
            <button
              onClick={startCreate}
              className="bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-6 py-2.5 text-xs tracking-[0.2em] uppercase transition-colors duration-300"
            >
              New Post
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-0 mb-6 border-b border-gold-muted/10">
            {(["all", "blog", "job"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 border-b-2 -mb-px ${
                  filter === f
                    ? "text-gold border-gold"
                    : "text-offwhite/30 border-transparent hover:text-offwhite/60"
                }`}
              >
                {f === "all"
                  ? `All (${posts.length})`
                  : f === "blog"
                    ? `Blog (${posts.filter((p) => p.post_type === "blog").length})`
                    : `Jobs (${posts.filter((p) => p.post_type === "job").length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-offwhite/30 text-sm py-12 text-center">
              Loading posts...
            </p>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 border border-gold-muted/10">
              <p className="text-offwhite/30 text-sm mb-4">No posts yet.</p>
              <button
                onClick={startCreate}
                className="text-gold text-xs tracking-[0.15em] uppercase hover:underline"
              >
                Create your first post
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gold-muted/10 bg-charcoal-light hover:bg-charcoal-mid transition-colors duration-200 px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-offwhite/80 text-sm truncate">
                        {post.title}
                      </h3>
                      <span
                        className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 flex-shrink-0 ${
                          post.status === "published"
                            ? "text-green-400/70 bg-green-400/5 border border-green-400/15"
                            : "text-offwhite/30 bg-offwhite/5 border border-offwhite/10"
                        }`}
                      >
                        {post.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-offwhite/25">
                      <span className="uppercase tracking-wide">
                        {post.post_type}
                      </span>
                      {post.job_category && (
                        <>
                          <span>&middot;</span>
                          <span>{post.job_category}</span>
                        </>
                      )}
                      {post.location_region && (
                        <>
                          <span>&middot;</span>
                          <span>{post.location_region}</span>
                        </>
                      )}
                      {post.published_at && (
                        <>
                          <span>&middot;</span>
                          <span>
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(post)}
                      className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 transition-colors"
                    >
                      Edit
                    </button>
                    {confirmDelete === post.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-400 text-[10px] tracking-[0.1em] uppercase px-2 py-1.5 hover:bg-red-400/10 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-offwhite/30 text-[10px] tracking-[0.1em] uppercase px-2 py-1.5 hover:text-offwhite/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(post.id)}
                        className="text-offwhite/20 hover:text-red-400 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {message && (
            <p
              className={`mt-4 text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400/70"}`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Create / Edit form view ──
  return (
    <div className="min-h-screen bg-charcoal pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-semibold text-gold">
            {editingId ? "Edit Post" : "New Post"}
          </h1>
          <button
            onClick={() => {
              setView("list");
              setMessage("");
            }}
            className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase transition-colors"
          >
            &larr; Back to list
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Post Type
            </label>
            <div className="flex gap-6">
              {(["blog", "job"] as const).map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
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
                  <span className="text-offwhite/70 text-sm">
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
                setForm((prev) => ({ ...prev, slug: generateSlug(e.target.value) }))
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
                  setForm((prev) => ({
                    ...prev,
                    seo_title: e.target.value,
                  }))
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

          {/* Body — Rich Text Editor */}
          <div>
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Body
            </label>
            <RichTextEditor
              content={form.body}
              onChange={(html) =>
                setForm((prev) => ({ ...prev, body: html }))
              }
            />
          </div>

          {/* Job-specific fields */}
          {form.post_type === "job" && (
            <div className="space-y-6 border border-gold-muted/10 p-4">
              <div>
                <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                  Salary
                </label>
                <input
                  type="text"
                  value={form.salary}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, salary: e.target.value }))
                  }
                  placeholder="e.g. $500,000 or $400,000 - $600,000"
                  className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40 placeholder:text-offwhite/20"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-8 py-3 text-xs tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : editingId
                  ? "Update Post"
                  : "Create Post"}
            </button>

            {message && (
              <p
                className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400/70"}`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAuth>
      <AdminContent />
    </AdminAuth>
  );
}

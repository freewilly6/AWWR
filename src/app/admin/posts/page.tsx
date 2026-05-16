"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  getSupabaseClient,
  JOB_CATEGORIES,
  LOCATION_REGIONS,
  type Post,
} from "@/lib/supabase";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-gold-muted/20 bg-charcoal-mid h-[340px] flex items-center justify-center">
      <span className="text-offwhite/20 text-xs">Loading editor...</span>
    </div>
  ),
});

const PREVIEW_KEY = "admin_preview";

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
  publish_at: string; // datetime-local; "" = publish immediately when status=published
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
  publish_at: "",
  seo_title: "",
  meta_description: "",
};

type View = "list" | "create" | "edit";
type Tab = "all" | "blog" | "job" | "trash";
type SortKey =
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "title_asc"
  | "title_desc";

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetime(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formFromPost(post: Post): FormData {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    post_type: post.post_type,
    job_category: post.job_category || "",
    location_region: post.location_region || "",
    salary: post.salary || "",
    status: post.status,
    publish_at:
      post.status === "published" ? toLocalDatetime(post.published_at) : "",
    seo_title: post.seo_title || "",
    meta_description: post.meta_description || "",
  };
}

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function postUrl(post: { post_type: "blog" | "job"; slug: string }) {
  return post.post_type === "job"
    ? `/opportunities/${post.slug}`
    : `/blog/${post.slug}`;
}

function relTime(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return d.toLocaleTimeString();
}

function AdminContent() {
  const [view, setView] = useState<View>("list");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // List view state
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("created_desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dirty / autosave
  const initialFormRef = useRef<FormData>(emptyForm);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [now, setNow] = useState(Date.now());

  // Slug availability check
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialFormRef.current),
    [form]
  );

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

  // Unsaved-changes guard
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Tick clock for "Saved Xs ago" display
  useEffect(() => {
    if (view === "list") return;
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, [view]);

  // Build DB payload from form
  const buildPayload = useCallback((f: FormData) => {
    let published_at: string | null;
    if (f.status === "draft") {
      published_at = null;
    } else if (f.publish_at) {
      published_at = fromLocalDatetime(f.publish_at);
    } else {
      published_at = new Date().toISOString();
    }
    return {
      title: f.title,
      slug: generateSlug(f.slug),
      excerpt: f.excerpt,
      body: f.body,
      post_type: f.post_type,
      job_category:
        f.post_type === "job" ? f.job_category || null : null,
      location_region:
        f.post_type === "job" ? f.location_region || null : null,
      salary: f.post_type === "job" ? f.salary || null : null,
      status: f.status,
      seo_title: f.seo_title || null,
      meta_description: f.meta_description || null,
      published_at,
    };
  }, []);

  // Live slug-availability check (debounced 500ms)
  useEffect(() => {
    const slug = generateSlug(form.slug);
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    slugCheckTimer.current = setTimeout(async () => {
      const supabase = getSupabaseClient();
      let query = supabase.from("posts").select("id").eq("slug", slug).limit(1);
      if (editingId) query = query.neq("id", editingId);
      const { data, error } = await query;
      if (error) {
        setSlugStatus("idle");
        return;
      }
      setSlugStatus(data && data.length > 0 ? "taken" : "available");
    }, 500);
    return () => {
      if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
    };
  }, [form.slug, editingId]);

  // Autosave (drafts only, edit only, debounced 3s)
  useEffect(() => {
    if (!editingId) return;
    if (form.status !== "draft") return;
    if (!isDirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setAutosaving(true);
      const supabase = getSupabaseClient();
      const payload = buildPayload(form);
      const { error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", editingId);
      if (!error) {
        initialFormRef.current = form;
        setSavedAt(new Date());
      }
      setAutosaving(false);
    }, 3000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [form, editingId, isDirty, buildPayload]);

  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: editingId ? prev.slug : generateSlug(val),
    }));
  };

  const startCreate = () => {
    setForm(emptyForm);
    initialFormRef.current = emptyForm;
    setEditingId(null);
    setMessage("");
    setSavedAt(null);
    setSlugStatus("idle");
    setView("create");
  };

  const startEdit = (post: Post) => {
    const f = formFromPost(post);
    setForm(f);
    initialFormRef.current = f;
    setEditingId(post.id);
    setMessage("");
    setSavedAt(null);
    setSlugStatus("idle");
    setView("edit");
  };

  const goBackToList = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Discard them?")) return;
    }
    setView("list");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    const supabase = getSupabaseClient();
    const payload = buildPayload(form);

    // Pre-save collision check (in case the live check raced)
    {
      let collisionQ = supabase
        .from("posts")
        .select("id")
        .eq("slug", payload.slug)
        .limit(1);
      if (editingId) collisionQ = collisionQ.neq("id", editingId);
      const { data: existing } = await collisionQ;
      if (existing && existing.length > 0) {
        setMessage("Error: That URL is already taken — try another slug.");
        setSlugStatus("taken");
        setSubmitting(false);
        return;
      }
    }

    let error;
    let savedId = editingId;
    if (editingId) {
      ({ error } = await supabase
        .from("posts")
        .update(payload)
        .eq("id", editingId));
    } else {
      const { data, error: insertError } = await supabase
        .from("posts")
        .insert(payload)
        .select("id")
        .single();
      error = insertError;
      if (data) savedId = data.id;
    }

    if (error) {
      const friendly =
        error.code === "23505" || /duplicate key|unique/i.test(error.message)
          ? "That URL is already taken — try another slug."
          : error.message;
      setMessage(`Error: ${friendly}`);
    } else {
      initialFormRef.current = form;
      setEditingId(savedId);
      setSavedAt(new Date());
      setMessage(editingId ? "Post updated." : "Post created.");
      await loadPosts();
      setTimeout(() => {
        setView("list");
        setMessage("");
      }, 1000);
    }
    setSubmitting(false);
  };

  const handlePreview = () => {
    const previewData = {
      title: form.title,
      excerpt: form.excerpt,
      body: form.body,
      post_type: form.post_type,
      job_category: form.job_category,
      location_region: form.location_region,
      salary: form.salary,
      published_at: form.publish_at
        ? fromLocalDatetime(form.publish_at) || new Date().toISOString()
        : new Date().toISOString(),
    };
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(previewData));
    window.open("/admin/preview", "_blank", "noopener");
  };

  // Per-row actions
  const moveToTrash = async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) await loadPosts();
  };
  const restorePost = async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("posts")
      .update({ deleted_at: null })
      .eq("id", id);
    if (!error) await loadPosts();
  };
  const deleteForever = async (id: string) => {
    if (!window.confirm("Permanently delete this post? This cannot be undone."))
      return;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (!error) await loadPosts();
  };
  const duplicatePost = async (post: Post) => {
    const supabase = getSupabaseClient();
    const rand = Math.random().toString(36).slice(2, 6);
    const payload = {
      title: `${post.title} (copy)`,
      slug: `${post.slug}-copy-${rand}`,
      excerpt: post.excerpt,
      body: post.body,
      post_type: post.post_type,
      job_category: post.job_category,
      location_region: post.location_region,
      salary: post.salary,
      status: "draft" as const,
      seo_title: post.seo_title,
      meta_description: post.meta_description,
      published_at: null,
    };
    const { error } = await supabase.from("posts").insert(payload);
    if (!error) await loadPosts();
  };

  // Bulk actions
  const bulkPublish = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("posts")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .in("id", ids);
    if (!error) {
      setSelectedIds(new Set());
      await loadPosts();
    }
  };
  const bulkUnpublish = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("posts")
      .update({ status: "draft", published_at: null })
      .in("id", ids);
    if (!error) {
      setSelectedIds(new Set());
      await loadPosts();
    }
  };
  const bulkTrash = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("posts")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    if (!error) {
      setSelectedIds(new Set());
      await loadPosts();
    }
  };
  const bulkRestore = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("posts")
      .update({ deleted_at: null })
      .in("id", ids);
    if (!error) {
      setSelectedIds(new Set());
      await loadPosts();
    }
  };
  const bulkDeleteForever = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Permanently delete ${ids.length} post(s)? This cannot be undone.`
      )
    )
      return;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("posts").delete().in("id", ids);
    if (!error) {
      setSelectedIds(new Set());
      await loadPosts();
    }
  };

  // Filtered + sorted list
  const visiblePosts = useMemo(() => {
    let list = posts.slice();

    if (tab === "trash") {
      list = list.filter((p) => p.deleted_at != null);
    } else {
      list = list.filter((p) => p.deleted_at == null);
      if (tab === "blog") list = list.filter((p) => p.post_type === "blog");
      else if (tab === "job") list = list.filter((p) => p.post_type === "job");
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.excerpt || "").toLowerCase().includes(q)
      );
    }

    const relevantDate = (p: Post) => p.published_at || p.created_at;
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((p) => new Date(relevantDate(p)).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      list = list.filter((p) => new Date(relevantDate(p)).getTime() <= to);
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "created_desc":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "created_asc":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "updated_desc":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case "title_asc":
          return a.title.localeCompare(b.title);
        case "title_desc":
          return b.title.localeCompare(a.title);
      }
    });

    return list;
  }, [posts, tab, search, dateFrom, dateTo, sortBy]);

  const counts = useMemo(() => {
    const live = posts.filter((p) => p.deleted_at == null);
    return {
      all: live.length,
      blog: live.filter((p) => p.post_type === "blog").length,
      job: live.filter((p) => p.post_type === "job").length,
      trash: posts.filter((p) => p.deleted_at != null).length,
    };
  }, [posts]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allVisibleSelected =
    visiblePosts.length > 0 &&
    visiblePosts.every((p) => selectedIds.has(p.id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visiblePosts.map((p) => p.id)));
    }
  };
  useEffect(() => {
    setSelectedIds(new Set());
  }, [tab]);

  const isScheduled = (p: Post) =>
    p.status === "published" &&
    p.published_at != null &&
    new Date(p.published_at).getTime() > Date.now();

  const hasFilters = search !== "" || dateFrom !== "" || dateTo !== "";

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
              + New Post
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 border-b border-gold-muted/10">
            {(["all", "blog", "job", "trash"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-colors duration-300 border-b-2 -mb-px ${
                  tab === t
                    ? t === "trash"
                      ? "text-red-400 border-red-400"
                      : "text-gold border-gold"
                    : "text-offwhite/30 border-transparent hover:text-offwhite/60"
                }`}
              >
                {t === "all"
                  ? `All (${counts.all})`
                  : t === "blog"
                    ? `Blog (${counts.blog})`
                    : t === "job"
                      ? `Jobs (${counts.job})`
                      : `Trash (${counts.trash})`}
              </button>
            ))}
          </div>

          {/* Search + sort + date filter */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, slug, excerpt..."
              className="flex-1 min-w-[200px] bg-charcoal-mid border border-gold-muted/20 text-offwhite px-3 py-2 text-xs focus:outline-none focus:border-gold-muted/40 placeholder:text-offwhite/20"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-charcoal-mid border border-gold-muted/20 text-offwhite/70 px-3 py-2 text-xs focus:outline-none focus:border-gold-muted/40"
            >
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="updated_desc">Recently updated</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From"
              className="bg-charcoal-mid border border-gold-muted/20 text-offwhite/70 px-3 py-2 text-xs focus:outline-none focus:border-gold-muted/40"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To"
              className="bg-charcoal-mid border border-gold-muted/20 text-offwhite/70 px-3 py-2 text-xs focus:outline-none focus:border-gold-muted/40"
            />
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="text-offwhite/40 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-2 py-2 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-2.5 bg-gold/5 border border-gold-muted/20">
              <span className="text-gold text-xs tracking-wide mr-2">
                {selectedIds.size} selected
              </span>
              {tab === "trash" ? (
                <>
                  <button
                    onClick={bulkRestore}
                    className="text-gold hover:bg-gold/10 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-gold-muted/30 transition-colors"
                  >
                    Restore
                  </button>
                  <button
                    onClick={bulkDeleteForever}
                    className="text-red-400 hover:bg-red-400/10 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-red-400/30 transition-colors"
                  >
                    Delete forever
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={bulkPublish}
                    className="text-gold hover:bg-gold/10 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-gold-muted/30 transition-colors"
                  >
                    Publish
                  </button>
                  <button
                    onClick={bulkUnpublish}
                    className="text-offwhite/60 hover:bg-offwhite/5 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-offwhite/15 transition-colors"
                  >
                    Unpublish
                  </button>
                  <button
                    onClick={bulkTrash}
                    className="text-red-400 hover:bg-red-400/10 text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border border-red-400/30 transition-colors"
                  >
                    Move to trash
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-2 py-1.5 transition-colors ml-auto"
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Select-all */}
          {visiblePosts.length > 0 && (
            <label className="inline-flex items-center gap-2 cursor-pointer mb-2 px-2">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="gold-checkbox"
              />
              <span className="text-offwhite/40 text-[10px] tracking-[0.15em] uppercase">
                Select all visible
              </span>
            </label>
          )}

          {loading ? (
            <p className="text-offwhite/30 text-sm py-12 text-center">
              Loading posts...
            </p>
          ) : visiblePosts.length === 0 ? (
            <div className="text-center py-16 border border-gold-muted/10">
              <p className="text-offwhite/30 text-sm mb-4">
                {hasFilters
                  ? "No posts match your filters."
                  : tab === "trash"
                    ? "Trash is empty."
                    : "No posts yet."}
              </p>
              {!hasFilters && tab !== "trash" && (
                <button
                  onClick={startCreate}
                  className="text-gold text-xs tracking-[0.15em] uppercase hover:underline"
                >
                  Create your first post
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {visiblePosts.map((post) => {
                const scheduled = isScheduled(post);
                return (
                  <div
                    key={post.id}
                    className={`border bg-charcoal-light hover:bg-charcoal-mid transition-colors duration-200 px-4 py-4 flex items-center gap-3 ${
                      selectedIds.has(post.id)
                        ? "border-gold-muted/40"
                        : "border-gold-muted/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(post.id)}
                      onChange={() => toggleSelected(post.id)}
                      className="gold-checkbox flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-offwhite/80 text-sm truncate">
                          {post.title}
                        </h3>
                        {tab !== "trash" && (
                          <span
                            className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 flex-shrink-0 ${
                              scheduled
                                ? "text-blue-300/80 bg-blue-300/5 border border-blue-300/20"
                                : post.status === "published"
                                  ? "text-green-400/70 bg-green-400/5 border border-green-400/15"
                                  : "text-offwhite/30 bg-offwhite/5 border border-offwhite/10"
                            }`}
                          >
                            {scheduled ? "Scheduled" : post.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-offwhite/25 flex-wrap">
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
                              {scheduled ? "Goes live " : ""}
                              {new Date(post.published_at).toLocaleString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {tab === "trash" ? (
                        <>
                          <button
                            onClick={() => restorePost(post.id)}
                            className="text-gold/70 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 transition-colors"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => deleteForever(post.id)}
                            className="text-offwhite/20 hover:text-red-400 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 transition-colors"
                          >
                            Delete forever
                          </button>
                        </>
                      ) : (
                        <>
                          {post.status === "published" && !scheduled && (
                            <a
                              href={postUrl(post)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 transition-colors"
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() => startEdit(post)}
                            className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => duplicatePost(post)}
                            className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 transition-colors"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => moveToTrash(post.id)}
                            className="text-offwhite/20 hover:text-red-400 text-[10px] tracking-[0.15em] uppercase px-2.5 py-1.5 transition-colors"
                          >
                            Trash
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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
  // `now` is read so the relative-time label refreshes on the 5s tick
  void now;
  const savedLabel = autosaving
    ? "Saving..."
    : savedAt
      ? `Saved ${relTime(savedAt)}`
      : isDirty
        ? "Unsaved changes"
        : "";

  return (
    <div className="min-h-screen bg-charcoal pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 className="font-heading text-3xl font-semibold text-gold">
            {editingId ? "Edit Post" : "New Post"}
          </h1>
          <div className="flex items-center gap-4">
            {savedLabel && (
              <span
                className={`text-[10px] tracking-[0.15em] uppercase ${
                  autosaving
                    ? "text-gold/70"
                    : isDirty
                      ? "text-yellow-400/70"
                      : "text-green-400/60"
                }`}
              >
                {savedLabel}
              </span>
            )}
            <button
              onClick={handlePreview}
              type="button"
              className="text-offwhite/40 hover:text-gold text-[10px] tracking-[0.15em] uppercase border border-gold-muted/20 hover:border-gold-muted/40 px-3 py-1.5 transition-colors"
            >
              Preview
            </button>
            <button
              onClick={goBackToList}
              className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase transition-colors"
            >
              &larr; Back to list
            </button>
          </div>
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
                setForm((prev) => ({
                  ...prev,
                  slug: generateSlug(e.target.value),
                }))
              }
              className={`w-full bg-charcoal-mid border text-offwhite/50 px-4 py-3 text-sm focus:outline-none transition-colors ${
                slugStatus === "taken"
                  ? "border-red-400/50 focus:border-red-400"
                  : "border-gold-muted/20 focus:border-gold-muted/40"
              }`}
              required
            />
            <div className="flex items-center justify-between gap-3 mt-1.5">
              <p className="text-offwhite/25 text-[10px] tracking-wide">
                /
                {form.post_type === "job" ? "opportunities" : "blog"}/
                <span className="text-gold/60">{form.slug || "your-slug"}</span>
              </p>
              {form.slug && (
                <span
                  className={`text-[10px] tracking-[0.15em] uppercase ${
                    slugStatus === "taken"
                      ? "text-red-400"
                      : slugStatus === "available"
                        ? "text-green-400/70"
                        : "text-offwhite/30"
                  }`}
                >
                  {slugStatus === "checking"
                    ? "Checking..."
                    : slugStatus === "available"
                      ? "Available"
                      : slugStatus === "taken"
                        ? "Already in use"
                        : ""}
                </span>
              )}
            </div>
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

          {/* Status + scheduled publish */}
          <div className="border border-gold-muted/10 p-4 space-y-4">
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

            {form.status === "published" && (
              <div>
                <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  value={form.publish_at}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, publish_at: e.target.value }))
                  }
                  className="bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
                />
                <p className="text-offwhite/30 text-[10px] mt-1.5 tracking-wide">
                  {form.publish_at &&
                  fromLocalDatetime(form.publish_at) &&
                  new Date(fromLocalDatetime(form.publish_at)!).getTime() >
                    Date.now()
                    ? "Will go live automatically at the chosen date and time."
                    : "Leave blank or set to past to publish immediately."}
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              type="submit"
              disabled={submitting || slugStatus === "taken"}
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

export default function AdminPostsPage() {
  return <AdminContent />;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient, type Post } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(user: User | null): string {
  if (!user) return "there";
  const meta = (user.user_metadata || {}) as { display_name?: string };
  if (meta.display_name && meta.display_name.trim()) {
    return meta.display_name.trim().split(/\s+/)[0];
  }
  if (user.email) return user.email.split("@")[0];
  return "there";
}

function StatTile({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  href: string;
  tone?: "default" | "scheduled" | "danger";
}) {
  const toneClass =
    tone === "scheduled"
      ? "text-blue-300/80"
      : tone === "danger"
        ? "text-red-400/80"
        : "text-gold";
  return (
    <Link
      href={href}
      className="border border-gold-muted/15 bg-charcoal-light hover:bg-charcoal-mid p-6 transition-colors duration-300 block"
    >
      <p className="text-offwhite/30 text-[10px] tracking-[0.2em] uppercase mb-3">
        {label}
      </p>
      <p className={`font-heading text-4xl font-semibold ${toneClass}`}>
        {value}
      </p>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(({ user }) => setUser(user));
    const supabase = getSupabaseClient();
    supabase
      .from("posts")
      .select("*")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPosts(data as Post[]);
        setLoading(false);
      });
  }, []);

  const now = Date.now();
  const live = posts.filter((p) => p.deleted_at == null);
  const counts = {
    published: live.filter(
      (p) =>
        p.status === "published" &&
        p.published_at != null &&
        new Date(p.published_at).getTime() <= now
    ).length,
    drafts: live.filter((p) => p.status === "draft").length,
    scheduled: live.filter(
      (p) =>
        p.status === "published" &&
        p.published_at != null &&
        new Date(p.published_at).getTime() > now
    ).length,
    trash: posts.filter((p) => p.deleted_at != null).length,
  };

  const recent = live.slice(0, 6);

  return (
    <div className="min-h-screen bg-charcoal pt-12 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <p className="text-gold-muted/50 text-[10px] tracking-[0.3em] uppercase mb-2">
              Dashboard
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-gold">
              {greeting()}, {firstName(user)}.
            </h1>
          </div>
          <Link
            href="/admin/posts"
            className="bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-6 py-2.5 text-xs tracking-[0.2em] uppercase transition-colors duration-300"
          >
            + New Post
          </Link>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <StatTile
            label="Published"
            value={counts.published}
            href="/admin/posts"
          />
          <StatTile
            label="Drafts"
            value={counts.drafts}
            href="/admin/posts"
          />
          <StatTile
            label="Scheduled"
            value={counts.scheduled}
            href="/admin/posts"
            tone="scheduled"
          />
          <StatTile
            label="In Trash"
            value={counts.trash}
            href="/admin/posts"
            tone="danger"
          />
        </div>

        {/* Recent activity */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gold text-xs tracking-[0.2em] uppercase font-heading">
              Recently Updated
            </h2>
            <Link
              href="/admin/posts"
              className="text-offwhite/40 hover:text-gold text-[10px] tracking-[0.15em] uppercase transition-colors"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <p className="text-offwhite/30 text-sm py-8 text-center">
              Loading...
            </p>
          ) : recent.length === 0 ? (
            <div className="border border-gold-muted/10 py-12 text-center">
              <p className="text-offwhite/30 text-sm mb-3">No posts yet.</p>
              <Link
                href="/admin/posts"
                className="text-gold text-xs tracking-[0.15em] uppercase hover:underline"
              >
                Create your first post
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((post) => {
                const scheduled =
                  post.status === "published" &&
                  post.published_at != null &&
                  new Date(post.published_at).getTime() > now;
                return (
                  <Link
                    key={post.id}
                    href={`/admin/posts`}
                    className="block border border-gold-muted/10 bg-charcoal-light hover:bg-charcoal-mid transition-colors duration-200 px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-offwhite/80 text-sm truncate">
                        {post.title}
                      </h3>
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
                    </div>
                    <p className="text-offwhite/25 text-[10px] tracking-wide">
                      {post.post_type === "job" ? "Job" : "Blog"} · updated{" "}
                      {new Date(post.updated_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-gold text-xs tracking-[0.2em] uppercase font-heading mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/posts"
              className="border border-gold-muted/15 bg-charcoal-light hover:bg-charcoal-mid p-5 transition-colors duration-300"
            >
              <p className="text-gold text-sm font-heading mb-1">
                Manage Posts
              </p>
              <p className="text-offwhite/40 text-[11px]">
                Create, edit, schedule, and organise jobs and blog articles.
              </p>
            </Link>
            <Link
              href="/admin/settings"
              className="border border-gold-muted/15 bg-charcoal-light hover:bg-charcoal-mid p-5 transition-colors duration-300"
            >
              <p className="text-gold text-sm font-heading mb-1">
                Site Settings
              </p>
              <p className="text-offwhite/40 text-[11px]">
                Edit phone number, principal name, and page intro text.
              </p>
            </Link>
            <Link
              href="/admin/account"
              className="border border-gold-muted/15 bg-charcoal-light hover:bg-charcoal-mid p-5 transition-colors duration-300"
            >
              <p className="text-gold text-sm font-heading mb-1">My Account</p>
              <p className="text-offwhite/40 text-[11px]">
                Change your display name and password.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

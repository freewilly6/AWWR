"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  signIn,
  signOut,
  onAuthStateChange,
  getSession,
} from "@/lib/auth";
import { getAllSettings, DEFAULT_SETTINGS, type Settings } from "@/lib/settings";
import type { User } from "@supabase/supabase-js";

function displayName(user: User): string {
  const meta = (user.user_metadata || {}) as { display_name?: string };
  if (meta.display_name && meta.display_name.trim()) {
    return meta.display_name.trim().split(/\s+/)[0];
  }
  if (user.email) return user.email.split("@")[0];
  return "there";
}

export default function AdminAuth({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getSession().then(({ user }) => {
      setUser(user);
      setLoading(false);
    });
    const subscription = onAuthStateChange((user) => setUser(user));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) getAllSettings().then(setSettings).catch(() => {});
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    }
    setSigningIn(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <p className="text-offwhite/30 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="w-full max-w-sm px-6">
          <h1 className="font-heading text-2xl text-gold mb-2 text-center">
            {settings.site_title}
          </h1>
          <p className="text-offwhite/40 text-[10px] tracking-[0.3em] uppercase text-center mb-8">
            Admin Login
          </p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
                required
              />
            </div>
            <div>
              <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={signingIn}
              className="w-full bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-8 py-3 text-xs tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-50"
            >
              {signingIn ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Hide admin chrome on the preview route — it should look like the public site
  const isPreview = pathname?.startsWith("/admin/preview");
  if (isPreview) {
    return <>{children}</>;
  }

  const tabs: { href: string; label: string; match: (p: string) => boolean }[] = [
    {
      href: "/admin",
      label: "Dashboard",
      match: (p) => p === "/admin",
    },
    {
      href: "/admin/posts",
      label: "Posts",
      match: (p) => p.startsWith("/admin/posts"),
    },
    {
      href: "/admin/account",
      label: "Account",
      match: (p) => p.startsWith("/admin/account"),
    },
    {
      href: "/admin/settings",
      label: "Settings",
      match: (p) => p.startsWith("/admin/settings"),
    },
  ];

  return (
    <div>
      <div className="fixed top-16 left-0 right-0 z-40 bg-charcoal-light border-b border-gold-muted/15">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">
          {/* Brand */}
          <Link
            href="/admin"
            className="text-gold font-heading text-sm tracking-wide hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            {settings.site_title.split(" — ")[0] || settings.site_title}
            <span className="text-offwhite/30 mx-2">/</span>
            <span className="text-offwhite/50 text-[10px] tracking-[0.25em] uppercase">
              Admin
            </span>
          </Link>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {tabs.map((t) => {
              const active = t.match(pathname || "");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase border-b-2 transition-colors ${
                    active
                      ? "text-gold border-gold"
                      : "text-offwhite/40 border-transparent hover:text-gold/70"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Right side */}
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="text-offwhite/40 hover:text-gold text-[10px] tracking-[0.15em] uppercase transition-colors hidden sm:inline"
          >
            View Site ↗
          </Link>
          <span className="text-offwhite/30 text-[10px] tracking-wide hidden lg:inline">
            Howdy, {displayName(user)}
          </span>
          <button
            onClick={handleLogout}
            className="text-offwhite/40 hover:text-gold text-[10px] tracking-[0.15em] uppercase transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile tabs */}
        <nav className="md:hidden flex items-center gap-1 px-6 pb-2 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.match(pathname || "");
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? "text-gold border-gold"
                    : "text-offwhite/40 border-transparent"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-14">{children}</div>
    </div>
  );
}

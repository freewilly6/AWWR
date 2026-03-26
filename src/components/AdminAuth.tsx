"use client";

import { useState, useEffect, type ReactNode } from "react";
import { signIn, signOut, onAuthStateChange, getSession } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export default function AdminAuth({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    getSession().then(({ user }) => {
      setUser(user);
      setLoading(false);
    });

    const subscription = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setError("");
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Authentication failed."
      );
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
          <h1 className="font-heading text-2xl text-gold mb-8 text-center">
            Admin Login
          </h1>

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

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

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

  return (
    <div>
      {/* Admin header bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-charcoal-light border-b border-gold-muted/10">
        <div className="max-w-5xl mx-auto px-6 h-10 flex items-center justify-between">
          <span className="text-offwhite/30 text-[10px] tracking-wide">
            {user.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-offwhite/30 hover:text-gold text-[10px] tracking-[0.15em] uppercase transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      <div className="pt-10">{children}</div>
    </div>
  );
}

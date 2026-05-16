"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function AdminAccountPage() {
  const [user, setUser] = useState<User | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMessage, setPwMessage] = useState("");

  useEffect(() => {
    getSession().then(({ user }) => {
      setUser(user);
      const meta = (user?.user_metadata || {}) as { display_name?: string };
      setDisplayName(meta.display_name || "");
    });
  }, []);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setNameMessage("");
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    if (error) {
      setNameMessage(`Error: ${error.message}`);
    } else {
      setUser(data.user);
      setNameMessage("Saved.");
      setTimeout(() => setNameMessage(""), 2000);
    }
    setSavingName(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage("");
    if (newPassword.length < 8) {
      setPwMessage("Error: Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage("Error: Passwords don't match.");
      return;
    }
    setSavingPw(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwMessage(`Error: ${error.message}`);
    } else {
      setPwMessage("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwMessage(""), 3000);
    }
    setSavingPw(false);
  };

  return (
    <div className="min-h-screen bg-charcoal pt-12 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-gold-muted/50 text-[10px] tracking-[0.3em] uppercase mb-2">
            Account
          </p>
          <h1 className="font-heading text-3xl font-semibold text-gold">
            My Account
          </h1>
        </div>

        {/* Profile */}
        <section className="border border-gold-muted/10 p-6 mb-6">
          <h2 className="text-gold text-xs tracking-[0.2em] uppercase font-heading mb-5">
            Profile
          </h2>

          <div className="mb-5">
            <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
              Email
            </label>
            <p className="text-offwhite/60 text-sm">
              {user?.email ?? "—"}
            </p>
            <p className="text-offwhite/25 text-[10px] mt-1">
              Email cannot be changed here. Ask Aaron if you need a different
              address.
            </p>
          </div>

          <form onSubmit={saveName} className="space-y-4">
            <div>
              <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jonny"
                className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40 placeholder:text-offwhite/20"
              />
              <p className="text-offwhite/25 text-[10px] mt-1.5">
                Shown as &ldquo;Howdy, [name]&rdquo; in the admin header.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={savingName}
                className="bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-6 py-2.5 text-xs tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-50"
              >
                {savingName ? "Saving..." : "Save Name"}
              </button>
              {nameMessage && (
                <p
                  className={`text-xs ${
                    nameMessage.startsWith("Error")
                      ? "text-red-400"
                      : "text-green-400/70"
                  }`}
                >
                  {nameMessage}
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Password */}
        <section className="border border-gold-muted/10 p-6">
          <h2 className="text-gold text-xs tracking-[0.2em] uppercase font-heading mb-5">
            Change Password
          </h2>

          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40 placeholder:text-offwhite/20"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
                required
                minLength={8}
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={savingPw}
                className="bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-6 py-2.5 text-xs tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-50"
              >
                {savingPw ? "Saving..." : "Update Password"}
              </button>
              {pwMessage && (
                <p
                  className={`text-xs ${
                    pwMessage.startsWith("Error")
                      ? "text-red-400"
                      : "text-green-400/70"
                  }`}
                >
                  {pwMessage}
                </p>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

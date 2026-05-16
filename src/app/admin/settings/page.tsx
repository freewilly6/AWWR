"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllSettings,
  updateSetting,
  DEFAULT_SETTINGS,
  type SettingKey,
  type Settings,
} from "@/lib/settings";

type FieldDef = {
  key: SettingKey;
  label: string;
  help: string;
  multiline?: boolean;
  group: string;
};

const FIELDS: FieldDef[] = [
  {
    key: "site_title",
    label: "Site Title",
    help: "Shown in the browser tab and the admin header.",
    group: "Identity",
  },
  {
    key: "principal_name",
    label: "Principal",
    help: "The name credited on the homepage and Contact page.",
    group: "Identity",
  },
  {
    key: "contact_phone",
    label: "Phone Number",
    help: "Shown on the Contact page.",
    group: "Contact",
  },
  {
    key: "business_location",
    label: "Business Location",
    help: "Shown on the Contact page.",
    group: "Contact",
  },
  {
    key: "contact_intro",
    label: "Contact Page Intro",
    help: "The paragraph at the top of the Contact page.",
    multiline: true,
    group: "Page Copy",
  },
  {
    key: "careers_intro",
    label: "Career Opportunities Intro",
    help: "The paragraph at the top of the Career Opportunities page.",
    multiline: true,
    group: "Page Copy",
  },
];

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Settings>(DEFAULT_SETTINGS);
  const [initial, setInitial] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAllSettings().then((s) => {
      setValues(s);
      setInitial(s);
      setLoading(false);
    });
  }, []);

  const dirtyKeys = (Object.keys(values) as SettingKey[]).filter(
    (k) => values[k] !== initial[k]
  );
  const isDirty = dirtyKeys.length > 0;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await Promise.all(
        dirtyKeys.map((k) => updateSetting(k, values[k]))
      );
      setInitial(values);
      setMessage("Saved. The website is updated.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(
        `Error: ${err instanceof Error ? err.message : "Could not save."}`
      );
    }
    setSaving(false);
  };

  const handleReset = () => {
    setValues(initial);
    setMessage("");
  };

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  return (
    <div className="min-h-screen bg-charcoal pt-12 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <p className="text-gold-muted/50 text-[10px] tracking-[0.3em] uppercase mb-2">
              Settings
            </p>
            <h1 className="font-heading text-3xl font-semibold text-gold">
              Site Settings
            </h1>
            <p className="text-offwhite/40 text-sm mt-2">
              Edit text that appears on the live website. Changes go live as
              soon as you save.
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="text-offwhite/40 hover:text-gold text-[10px] tracking-[0.15em] uppercase border border-gold-muted/20 hover:border-gold-muted/40 px-3 py-1.5 transition-colors"
          >
            View Site ↗
          </Link>
        </div>

        {loading ? (
          <p className="text-offwhite/30 text-sm py-12 text-center">
            Loading settings...
          </p>
        ) : (
          <>
            {groups.map((group) => (
              <section key={group} className="border border-gold-muted/10 p-6 mb-6">
                <h2 className="text-gold text-xs tracking-[0.2em] uppercase font-heading mb-5">
                  {group}
                </h2>
                <div className="space-y-5">
                  {FIELDS.filter((f) => f.group === group).map((f) => (
                    <div key={f.key}>
                      <label className="text-gold text-xs tracking-[0.15em] uppercase block mb-2">
                        {f.label}
                      </label>
                      {f.multiline ? (
                        <textarea
                          value={values[f.key]}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [f.key]: e.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40 resize-y"
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[f.key]}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [f.key]: e.target.value,
                            }))
                          }
                          className="w-full bg-charcoal-mid border border-gold-muted/20 text-offwhite px-4 py-3 text-sm focus:outline-none focus:border-gold-muted/40"
                        />
                      )}
                      <p className="text-offwhite/25 text-[10px] mt-1.5">
                        {f.help}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Sticky save bar */}
            <div className="sticky bottom-4 mt-8 bg-charcoal-light border border-gold-muted/30 px-5 py-3 flex items-center justify-between gap-3 flex-wrap shadow-xl">
              <p
                className={`text-xs ${
                  message.startsWith("Error")
                    ? "text-red-400"
                    : message
                      ? "text-green-400/80"
                      : isDirty
                        ? "text-yellow-400/70"
                        : "text-offwhite/30"
                }`}
              >
                {message ||
                  (isDirty
                    ? `${dirtyKeys.length} unsaved change${dirtyKeys.length === 1 ? "" : "s"}`
                    : "All changes saved.")}
              </p>
              <div className="flex gap-2">
                {isDirty && (
                  <button
                    onClick={handleReset}
                    type="button"
                    className="text-offwhite/40 hover:text-gold text-[10px] tracking-[0.15em] uppercase px-3 py-2 transition-colors"
                  >
                    Discard
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="bg-gold/10 border border-gold-muted/30 hover:bg-gold/20 text-gold px-6 py-2 text-xs tracking-[0.2em] uppercase transition-colors duration-300 disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

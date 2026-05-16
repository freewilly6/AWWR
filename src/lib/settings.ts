import { getSupabaseClient } from "./supabase";

export type SettingKey =
  | "site_title"
  | "contact_phone"
  | "principal_name"
  | "business_location"
  | "careers_intro"
  | "contact_intro";

export type Settings = Record<SettingKey, string>;

export const DEFAULT_SETTINGS: Settings = {
  site_title: "United States — World Wide Recruitment",
  contact_phone: "+1 (352) 617-9517",
  principal_name: "Jonny Scott-Slater",
  business_location: "Southern United States",
  careers_intro:
    "Executive recruitment business with world-wide clients situated in the United States and other selected global business locations.",
  contact_intro:
    "For executive search enquiries, retained assignments, or to discuss a confidential appointment, please contact us directly.",
};

export async function getAllSettings(): Promise<Settings> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");
    if (error || !data) return DEFAULT_SETTINGS;
    const merged: Settings = { ...DEFAULT_SETTINGS };
    for (const row of data) {
      if (row.key in merged && typeof row.value === "string") {
        merged[row.key as SettingKey] = row.value;
      }
    }
    return merged;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSetting(
  key: SettingKey,
  value: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

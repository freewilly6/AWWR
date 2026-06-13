import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  published_at: string;
  featured_image: string | null;
  post_type: "blog" | "job";
  job_category: string | null;
  location_region: string | null;
  salary: string | null;
  status: "draft" | "published";
  seo_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
};

export const JOB_CATEGORIES = [
  "Law",
  "AI",
  "Science",
  "Industry",
  "Finance",
  "Engineering",
  "Robotics",
  "Medical",
  "Accounting",
  "HR",
  "IT",
  "Telecommunications",
  "TV & Media",
  "Hospitality",
  "Property-Facility Management",
  "Strategy",
  "Marketing",
  "Econometrics",
  "Director",
  "Utilities",
  "Sports",
] as const;

// Columns for list/card views — everything except the heavy `body` HTML.
// The full body is only fetched when viewing or editing a single post.
export const POST_LIST_COLUMNS =
  "id,title,slug,excerpt,published_at,featured_image,post_type,job_category,location_region,salary,status,seo_title,meta_description,created_at,updated_at,deleted_at";

export const LOCATION_REGIONS = [
  "African Nations",
  "Alaska",
  "Asia Pacific",
  "Canada",
  "Caribbean",
  "Europe",
  "Greenland",
  "Offshore",
  "South America",
  "United Kingdom",
  "United States",
  "World-Wide",
] as const;

// Single shared client. Creating a new client per call spins up a fresh
// GoTrueClient each time — they all share one localStorage session key and
// race each other refreshing the auth token, which inflates request volume
// and can knock the session out mid-use.
let client: SupabaseClient | null = null;

function getClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  client = createClient(url, key);
  return client;
}

export function getSupabaseClient() {
  return getClient();
}

export async function getPosts(type?: "blog" | "job") {
  const supabase = getClient();
  const nowIso = new Date().toISOString();
  let query = supabase
    .from("posts")
    .select(POST_LIST_COLUMNS)
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false });

  if (type) {
    query = query.eq("post_type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

export async function getPostBySlug(slug: string) {
  const supabase = getClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", nowIso)
    .single();

  if (error) throw error;
  return data as Post;
}

export async function getFilteredJobs(
  categories: string[],
  regions: string[]
) {
  const supabase = getClient();
  const nowIso = new Date().toISOString();
  let query = supabase
    .from("posts")
    .select(POST_LIST_COLUMNS)
    .eq("post_type", "job")
    .eq("status", "published")
    .is("deleted_at", null)
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false });

  if (categories.length > 0) {
    query = query.in("job_category", categories);
  }
  if (regions.length > 0) {
    query = query.in("location_region", regions);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Post[];
}

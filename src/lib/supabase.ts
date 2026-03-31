import { createClient } from "@supabase/supabase-js";

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
  status: "draft" | "published";
  seo_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
};

export const JOB_CATEGORIES = [
  "Law",
  "AI",
  "Science",
  "Industry",
  "Finance",
  "Engineering",
  "Robotics",
  "Medicine",
  "Accounting",
  "HR",
  "IT",
] as const;

export const LOCATION_REGIONS = [
  "African Nations",
  "Alaska",
  "Caribbean",
  "Europe",
  "Greenland",
  "Offshore",
  "South America",
  "United States",
  "World-Wide",
] as const;

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export function getSupabaseClient() {
  return getClient();
}

export async function getPosts(type?: "blog" | "job") {
  const supabase = getClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
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
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) throw error;
  return data as Post;
}

export async function getFilteredJobs(
  categories: string[],
  regions: string[]
) {
  const supabase = getClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("post_type", "job")
    .eq("status", "published")
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

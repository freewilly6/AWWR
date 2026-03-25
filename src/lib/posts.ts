import { getPosts, getPostBySlug, getFilteredJobs, type Post } from "./supabase";
import { placeholderPosts } from "./placeholder-data";

const useSupabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url-here";

export async function fetchPosts(type?: "blog" | "job"): Promise<Post[]> {
  if (useSupabase) {
    return getPosts(type);
  }
  let posts = placeholderPosts.filter((p) => p.status === "published");
  if (type) {
    posts = posts.filter((p) => p.post_type === type);
  }
  return posts.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  if (useSupabase) {
    try {
      return await getPostBySlug(slug);
    } catch {
      return null;
    }
  }
  return placeholderPosts.find((p) => p.slug === slug) || null;
}

export async function fetchFilteredJobs(
  categories: string[],
  regions: string[]
): Promise<Post[]> {
  if (useSupabase) {
    return getFilteredJobs(categories, regions);
  }
  let posts = placeholderPosts.filter(
    (p) => p.post_type === "job" && p.status === "published"
  );
  if (categories.length > 0) {
    posts = posts.filter(
      (p) => p.job_category && categories.includes(p.job_category)
    );
  }
  if (regions.length > 0) {
    posts = posts.filter(
      (p) => p.location_region && regions.includes(p.location_region)
    );
  }
  return posts.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

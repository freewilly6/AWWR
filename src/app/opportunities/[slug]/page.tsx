import { fetchPostBySlug } from "@/lib/posts";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} | United States — World Wide Recruitment`,
    description: post.excerpt,
  };
}

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) notFound();

  // Reuse the blog post template — redirect to keep one canonical URL
  redirect(`/blog/${slug}`);
}

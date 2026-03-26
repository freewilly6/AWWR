import { fetchPostBySlug, fetchPosts } from "@/lib/posts";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: post.seo_title || `${post.title} | American — World Wide Recruitment`,
    description: post.meta_description || post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) notFound();

  const backLink =
    post.post_type === "job" ? "/career-opportunities" : "/blog";
  const backLabel =
    post.post_type === "job" ? "Career Opportunities" : "Blog";

  return (
    <div className="min-h-screen bg-charcoal-light pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href={backLink}
          className="text-gold-muted/60 hover:text-gold text-xs tracking-[0.15em] uppercase transition-colors duration-300 inline-block mb-8"
        >
          &larr; {backLabel}
        </Link>

        <article>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-gold mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-8 text-xs text-offwhite/30">
            <time>
              {new Date(post.published_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.job_category && (
              <span className="text-gold-muted tracking-[0.1em] uppercase">
                {post.job_category}
              </span>
            )}
            {post.location_region && (
              <span>{post.location_region}</span>
            )}
          </div>

          <div className="border-t border-gold-muted/15 pt-8">
            <div
              className="post-body text-offwhite/70 text-[15px]"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </div>
        </article>
      </div>
    </div>
  );
}

import { fetchPosts } from "@/lib/posts";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog | American — World Wide Recruitment",
  description:
    "Insights and commentary on executive recruitment, global talent markets, and corporate leadership.",
};

export default async function BlogPage() {
  const posts = await fetchPosts("blog");

  return (
    <div className="min-h-screen bg-charcoal pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold pinstripe-text mb-10 pb-1">
          Blog
        </h1>

        {posts.length === 0 ? (
          <p className="text-offwhite/30 text-sm text-center py-12">
            No articles published yet.
          </p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className="block border border-gold-muted/15 hover:border-gold-muted/30 bg-charcoal-light hover:bg-charcoal-mid transition-colors duration-300 p-6"
              >
                <h2 className="font-heading text-gold text-xl mb-2">
                  {post.title}
                </h2>
                <p className="text-offwhite/50 text-sm leading-relaxed mb-3">
                  {post.excerpt}
                </p>
                <time className="text-offwhite/25 text-xs">
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

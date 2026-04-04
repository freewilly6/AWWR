import type { Metadata } from "next";
import GlobeWrapper from "@/components/GlobeWrapper";
import CategoryStrip from "@/components/CategoryStrip";
import FeaturedJobCarousel from "@/components/FeaturedJobCarousel";
import { fetchPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "United States — World Wide Recruitment | Executive Search & Headhunting",
  description:
    "Global executive search, headhunting, and retained recruitment. Placing senior leaders across law, finance, engineering, AI, medicine, and industry worldwide.",
};

export default async function Home() {
  const jobs = await fetchPosts("job");

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-charcoal pt-16 overflow-hidden">
        {/* Subtle radial backdrop behind globe */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(201,168,76,0.03) 0%, rgba(201,168,76,0.01) 40%, transparent 70%)",
          }}
        />

        {/* Globe */}
        <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] lg:w-[460px] lg:h-[460px] mb-12 animate-fade-in">
          <GlobeWrapper />
        </div>

        {/* Title */}
        <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[0.03em] text-center px-6 text-gold animate-fade-up animate-delay-1">
          <span className="block sm:inline">United States</span>
          <span className="block sm:hidden leading-none py-0.5">—</span>
          <span className="hidden sm:inline"> — </span>
          <span className="block sm:inline">World Wide Recruitment</span>
        </h1>

        {/* Thin gold rule */}
        <div className="w-full max-w-3xl px-6 mt-10 animate-fade-in animate-delay-2">
          <div className="gold-rule" />
        </div>

        {/* Tagline row */}
        <div className="mt-8 w-full max-w-6xl px-6 animate-fade-up animate-delay-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 text-center sm:whitespace-nowrap">
            {[
              "Head Hunter",
              "Executive Search",
              "Retained & Contingency Business",
            ].map((line, i) => (
              <span key={i} className="flex items-center justify-center">
                {i > 0 && (
                  <span
                    className="hidden sm:inline-block w-px h-4 bg-gold-muted/30 mx-6 lg:mx-10"
                    aria-hidden="true"
                  />
                )}
                <span className="text-gold text-base sm:text-sm lg:text-lg tracking-[0.25em] uppercase font-heading font-bold">
                  {line}
                </span>
              </span>
            ))}
          </div>
        </div>

      </section>

      {/* Featured job */}
      <div className="bg-charcoal pt-6 sm:-mt-6 pb-0 sm:pb-4">
        <div className="max-w-5xl mx-auto px-6">
          <FeaturedJobCarousel jobs={jobs} />
        </div>
      </div>

      {/* Category strip */}
      <CategoryStrip />
    </>
  );
}

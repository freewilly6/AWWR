import { fetchPosts } from "@/lib/posts";
import JobFilters from "@/components/JobFilters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Career Opportunities | United States — World Wide Recruitment",
  description:
    "Executive career opportunities worldwide. Browse retained and contingency search positions across law, finance, engineering, AI, medicine, and more.",
};

export default async function CareerOpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const jobs = await fetchPosts("job");

  return (
    <div className="min-h-screen bg-charcoal pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-6">
        {/* Page title */}
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-gold mb-4">
          Career Opportunities
        </h1>

        {/* Intro line */}
        <p className="text-gold text-sm tracking-wide leading-relaxed mb-14 border-b border-gold-muted/10 pb-8">
          Executive recruitment business with world-wide clients situated in the
          United States and other selected global business locations.
        </p>

        <JobFilters initialPosts={jobs} initialCategory={params.category} />
      </div>
    </div>
  );
}

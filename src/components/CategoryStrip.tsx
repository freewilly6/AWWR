import Link from "next/link";

const SECTORS: { label: string; category?: string }[] = [
  { label: "Law" },
  { label: "AI" },
  { label: "Science" },
  { label: "Industry" },
  { label: "Finance" },
  { label: "Engineering" },
  { label: "Robotics" },
  { label: "Medical" },
  { label: "Accounting" },
  { label: "HR" },
  { label: "IT" },
  { label: "Telecom", category: "Telecommunications" },
];

export default function CategoryStrip() {
  return (
    <section className="w-full bg-charcoal">
      {/* Top separator */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="gold-rule" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Sector label */}
        <p className="text-center text-gold text-base tracking-[0.4em] uppercase mb-8 font-body font-bold">
          Sectors
        </p>

        {/* Gold blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {SECTORS.map((sector) => (
            <Link
              key={sector.label}
              href={`/career-opportunities?category=${encodeURIComponent(sector.category || sector.label)}`}
              className="category-block border border-gold-muted/15 bg-gold/[0.03] hover:bg-gold/[0.07] transition-all duration-500 px-4 py-8 lg:py-10 flex items-center justify-center group"
            >
              <span className="text-gold group-hover:text-white text-base sm:text-lg tracking-[0.2em] uppercase font-heading font-bold text-center transition-colors duration-500">
                {sector.label}
              </span>
            </Link>
          ))}
        </div>

        {/* View More button */}
        <div className="mt-8 text-center">
          <Link
            href="/career-opportunities"
            className="inline-block border border-gold/30 bg-gold/[0.05] hover:bg-gold/[0.12] transition-all duration-500 px-10 py-4 group"
          >
            <span className="text-gold group-hover:text-white text-base sm:text-lg tracking-[0.2em] uppercase font-heading font-bold transition-colors duration-500">
              View More
            </span>
          </Link>
        </div>

        {/* Principal credit */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4">
            <span className="w-8 h-px bg-gold-muted/20" />
            <p className="text-gold text-xl sm:text-2xl tracking-[0.3em] uppercase font-heading font-extrabold">
              Jonny Scott&#8209;Slater
            </p>
            <span className="w-8 h-px bg-gold-muted/20" />
          </div>
        </div>
      </div>
    </section>
  );
}

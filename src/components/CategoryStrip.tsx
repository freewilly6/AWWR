import Link from "next/link";

const SECTORS = [
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
        <p className="text-center text-gold-muted/40 text-sm tracking-[0.4em] uppercase mb-8 font-body">
          Sectors
        </p>

        {/* Gold blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-5">
          {SECTORS.map((sector) => (
            <Link
              key={sector}
              href={`/career-opportunities?category=${encodeURIComponent(sector)}`}
              className="category-block border border-gold-muted/15 bg-gold/[0.03] hover:bg-gold/[0.07] transition-all duration-500 px-4 py-8 lg:py-10 flex items-center justify-center group"
            >
              <span className="text-gold/80 group-hover:text-gold text-sm sm:text-base tracking-[0.2em] uppercase font-heading font-medium text-center transition-colors duration-500">
                {sector}
              </span>
            </Link>
          ))}
        </div>

        {/* Principal credit */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4">
            <span className="w-8 h-px bg-gold-muted/20" />
            <p className="text-gold-muted/40 text-lg sm:text-xl tracking-[0.3em] uppercase font-heading">
              Jonny Scott-Slater
            </p>
            <span className="w-8 h-px bg-gold-muted/20" />
          </div>
        </div>
      </div>
    </section>
  );
}

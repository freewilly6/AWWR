import GlobeWrapper from "@/components/GlobeWrapper";
import CategoryStrip from "@/components/CategoryStrip";

export default function Home() {
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
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[0.03em] text-center px-6 pinstripe-text animate-fade-up animate-delay-1">
          United States — World Wide Recruitment
        </h1>

        {/* Thin gold rule */}
        <div className="w-full max-w-3xl px-6 mt-10 animate-fade-in animate-delay-2">
          <div className="gold-rule" />
        </div>

        {/* Tagline row */}
        <div className="mt-8 w-full max-w-5xl px-6 animate-fade-up animate-delay-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 text-center">
            {[
              "Head Hunter",
              "Executive Search",
              "Retained & Contingency Business",
            ].map((line, i) => (
              <span key={i} className="flex items-center justify-center">
                {i > 0 && (
                  <span
                    className="hidden sm:inline-block w-px h-4 bg-gold-muted/30 mx-10"
                    aria-hidden="true"
                  />
                )}
                <span className="text-gold-muted/70 text-sm sm:text-base tracking-[0.25em] uppercase font-heading font-medium">
                  {line}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-fade-in animate-delay-5">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-gold-muted/30 to-transparent" />
        </div>
      </section>

      {/* Category strip */}
      <CategoryStrip />
    </>
  );
}

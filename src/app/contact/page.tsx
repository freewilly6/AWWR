import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | United States — World Wide Recruitment",
  description:
    "Contact United States — World Wide Recruitment for executive search and retained recruitment enquiries.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-charcoal pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold pinstripe-text mb-10">
          Contact
        </h1>

        <div className="border border-gold-muted/15 bg-charcoal-light p-8 sm:p-12">
          <p className="text-offwhite/50 text-sm leading-relaxed mb-8">
            For executive search enquiries, retained assignments, or to discuss
            a confidential appointment, please contact us directly.
          </p>

          <div className="space-y-6">
            <div>
              <h2 className="text-gold text-xs tracking-[0.2em] uppercase mb-2 font-heading">
                Telephone
              </h2>
              <p className="text-offwhite/70 text-lg font-heading">
                01 352 617 9517
              </p>
            </div>

            <div className="border-t border-gold-muted/10 pt-6">
              <h2 className="text-gold text-xs tracking-[0.2em] uppercase mb-2 font-heading">
                Principal
              </h2>
              <p className="text-offwhite/70">Jonny Scott-Slater</p>
            </div>

            <div className="border-t border-gold-muted/10 pt-6">
              <h2 className="text-gold text-xs tracking-[0.2em] uppercase mb-2 font-heading">
                Business Location
              </h2>
              <p className="text-offwhite/70">Southern United States</p>
            </div>

            <div className="border-t border-gold-muted/10 pt-6">
              <p className="text-offwhite/30 text-xs leading-relaxed">
                United States — World Wide Recruitment operates across the United
                States and selected global business locations. All enquiries are
                handled with the strictest confidence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

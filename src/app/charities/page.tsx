import type { Metadata } from "next";
import Image from "next/image";
import helpForHeroes from "@/lib/help-for-heros.jpg";
import sowfCover from "@/lib/sowf_cover.png";

export const metadata: Metadata = {
  title: "Charities We Support | United States — World Wide Recruitment",
  description:
    "United States — World Wide Recruitment proudly supports Help for Heroes and the Special Operations Warrior Foundation.",
};

export default function CharitiesPage() {
  return (
    <div className="min-h-screen bg-charcoal pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold pinstripe-text mb-4">
          Charities We Support
        </h1>

        <p className="text-offwhite/40 text-sm leading-relaxed mb-14 max-w-xl">
          We are proud to direct donations to the following organisations
          that support our service men and women.
        </p>

        <div className="space-y-12">
          {/* Help for Heroes */}
          <div className="border border-gold-muted/15 bg-charcoal-light overflow-hidden">
            <Image
              src={helpForHeroes}
              alt="Help for Heroes"
              className="w-full h-auto"
            />
            <div className="p-8 sm:p-10">
              <h2 className="font-heading text-gold text-lg tracking-wide mb-3">
                Help for Heroes
              </h2>
              <p className="text-offwhite/50 text-sm leading-relaxed">
                Help for Heroes supports members of the Armed Forces community
                with injuries and illnesses attributable to their service.
                From physical rehabilitation to mental health support, they
                provide lifelong assistance to those who have served.
              </p>
              <a
                href="https://www.helpforheroes.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-gold/60 hover:text-gold text-[10px] tracking-[0.2em] uppercase transition-colors duration-300"
              >
                helpforheroes.org.uk &rarr;
              </a>
            </div>
          </div>

          {/* Special Operations Warrior Foundation */}
          <div className="border border-gold-muted/15 bg-charcoal-light overflow-hidden">
            <Image
              src={sowfCover}
              alt="Special Operations Warrior Foundation"
              className="w-full h-auto"
            />
            <div className="p-8 sm:p-10">
              <h2 className="font-heading text-gold text-lg tracking-wide mb-3">
                Special Operations Warrior Foundation
              </h2>
              <p className="text-offwhite/50 text-sm leading-relaxed">
                The Special Operations Warrior Foundation provides full
                scholarship grants and educational counselling to the surviving
                children of special operations personnel who lose their lives in
                the line of duty. Their &ldquo;Cradle to Career&rdquo;
                programme ensures no child is left behind.
              </p>
              <a
                href="https://www.specialops.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-gold/60 hover:text-gold text-[10px] tracking-[0.2em] uppercase transition-colors duration-300"
              >
                specialops.org &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

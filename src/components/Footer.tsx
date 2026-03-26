import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-charcoal">
      <div className="max-w-7xl mx-auto px-6">
        <div className="gold-rule" />
      </div>
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="font-heading text-gold/80 text-sm tracking-[0.15em] uppercase mb-4 font-medium">
              American — World Wide Recruitment
            </p>
            <p className="text-offwhite/30 text-[11px] leading-relaxed font-light tracking-wide">
              Executive Search &amp; Headhunting
              <br />
              Retained and Contingency Business
            </p>
          </div>
          <div>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                {
                  href: "/career-opportunities",
                  label: "Career Opportunities",
                },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
                { href: "/charities", label: "Charities" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-offwhite/35 hover:text-gold text-[10px] tracking-[0.15em] uppercase transition-colors duration-400 font-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:text-right">
            <p className="text-offwhite/30 text-[11px] font-light tracking-wide">
              01 352 617 9517
            </p>
          </div>
        </div>
        <div className="mt-14 pt-6 border-t border-gold-muted/8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-offwhite/20 text-[10px] font-light tracking-wide">
            &copy; {new Date().getFullYear()} American — World Wide Recruitment
          </p>
          <p className="text-offwhite/20 text-[10px] font-light tracking-[0.15em] uppercase">
            Jonny Scott-Slater
          </p>
        </div>
      </div>
    </footer>
  );
}

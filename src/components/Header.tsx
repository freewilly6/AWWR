"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/career-opportunities", label: "Career Opportunities" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-charcoal/95 backdrop-blur-sm border-b border-gold-muted/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading text-gold text-sm tracking-[0.25em] uppercase transition-opacity duration-300 hover:opacity-70"
        >
          AWWR
        </Link>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-12">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-offwhite/50 hover:text-gold text-[10px] tracking-[0.2em] uppercase transition-colors duration-400 font-light"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-gold/70 hover:text-gold p-2 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            width="18"
            height="12"
            viewBox="0 0 18 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            {open ? (
              <>
                <line x1="2" y1="1" x2="16" y2="11" />
                <line x1="2" y1="11" x2="16" y2="1" />
              </>
            ) : (
              <>
                <line x1="0" y1="1" x2="18" y2="1" />
                <line x1="3" y1="6" x2="18" y2="6" />
                <line x1="0" y1="11" x2="18" y2="11" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-charcoal/98 backdrop-blur-sm border-b border-gold-muted/10">
          <ul className="px-6 py-8 space-y-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-offwhite/50 hover:text-gold text-xs tracking-[0.2em] uppercase transition-colors duration-300 block font-light"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

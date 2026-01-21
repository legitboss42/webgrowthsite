"use client";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-5 py-4 backdrop-blur">
          {/* Brand */}
          <a href="/" className="font-semibold tracking-tight text-white">
            Web Growth
          </a>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a className="hover:text-white transition" href="#services">Services</a>
            <a className="hover:text-white transition" href="#about">About</a>
            <a className="hover:text-white transition" href="#portfolio">Portfolio</a>
            <a className="hover:text-white transition" href="#contact">Contact</a>
          </nav>

          {/* CTA */}
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Request a Quote
          </a>
        </div>
      </div>
    </header>
  );
}

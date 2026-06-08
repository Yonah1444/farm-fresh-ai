import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <Link to="/" className="font-display italic text-xl text-accent">
          AgriConnect AI
        </Link>
        <div className="flex gap-8 text-[10px] uppercase tracking-widest text-muted font-bold">
          <Link to="/ecosystem">Ecosystem</Link>
          <Link to="/market">Market</Link>
          <Link to="/investment">Investment</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest">
          © 2026 — Nairobi, Kenya
        </p>
      </div>
    </footer>
  );
}

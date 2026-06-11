import { Link } from "@tanstack/react-router";

const links = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/ecosystem", label: "Ecosystem" },
  { to: "/market", label: "Market Analysis" },
  { to: "/investment", label: "Investment" },
] as const;

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="font-display italic text-2xl font-bold tracking-tight text-accent"
          >
            AgriConnect AI
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium uppercase tracking-wider text-muted">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="hover:text-primary transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm font-medium text-muted hover:text-primary transition-colors">
            Sign in
          </Link>
          <Link
            to="/dashboard"
            className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-bold hover:bg-primary/90 transition-all"
          >
            Farmer Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}

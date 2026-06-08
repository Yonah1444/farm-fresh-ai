import { createFileRoute, Link } from "@tanstack/react-router";
import heroSoil from "@/assets/hero-soil.jpg";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { StatGrid } from "@/components/stat-grid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriConnect AI — Digitizing the Generative Power of East Africa" },
      {
        name: "description",
        content:
          "A unified digital ecosystem connecting 500,000 smallholders to AI diagnostics, transparent markets, and institutional finance.",
      },
      { property: "og:title", content: "AgriConnect AI — Series A Opportunity" },
      {
        property: "og:description",
        content: "$3.5M raise • 34% projected IRR • All farm produce: vegetables, fruits, staples, livestock.",
      },
    ],
  }),
  component: Home,
});

const heroStats = [
  { value: "$3.5M", label: "Investment Ask" },
  { value: "34%", label: "Projected IRR" },
  { value: "500k", label: "Farmer Reach (Y3)" },
  { value: "$4.8M", label: "Y3 Revenue" },
];

const features = [
  {
    n: "01",
    tone: "accent" as const,
    title: "AI Diagnosis",
    body: "Proprietary ML models identifying 20+ crop and livestock diseases from simple photos. From banana wilt to tomato blight, resolved in seconds.",
  },
  {
    n: "02",
    tone: "primary" as const,
    title: "Unified Market",
    body: "Connecting livestock, vegetables, fruits and staples directly to exporters, retailers and hotels — bypassing opaque middleman pricing.",
  },
  {
    n: "03",
    tone: "accent" as const,
    title: "Agrovet Network",
    body: "Verified input supply chain for quality seeds, fungicides, fertilizers and veterinary drugs, with transparent pricing and micro-credit.",
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <SiteNav />

      {/* Hero */}
      <header className="relative overflow-hidden pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl animate-fade-up">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-6 block">
              Series A Opportunity
            </span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-balance mb-8">
              Digitizing the <span className="italic text-accent">Generative</span> Power of East Africa.
            </h1>
            <p className="text-xl text-muted max-w-[45ch] text-pretty leading-relaxed mb-12">
              A unified digital ecosystem connecting 500,000 smallholders to AI diagnostics,
              transparent marketplaces, and institutional finance — for vegetables, fruits,
              staples and livestock alike.
            </p>
            <StatGrid stats={heroStats} />
          </div>
        </div>

        <div className="absolute top-0 right-0 w-1/2 h-full -z-10 opacity-30 pointer-events-none hidden md:block">
          <img
            src={heroSoil}
            alt=""
            width={1280}
            height={1600}
            className="w-full h-full object-cover [mask-image:linear-gradient(to_left,black,transparent)]"
          />
        </div>
      </header>

      {/* Market Depth */}
      <section className="py-24 bg-card ring-1 ring-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5">
              <h2 className="font-display text-4xl mb-6">
                Beyond Staples: The High-Value Opportunity
              </h2>
              <p className="text-muted leading-relaxed mb-8">
                While competitors focus on grains, AgriConnect AI captures the full farm output.
                Perishables like vegetables and fruits represent 40% of smallholder value but suffer
                the highest post-harvest loss.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background/50">
                  <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">V</div>
                  <div>
                    <p className="text-sm font-bold">Vegetables & Fruits</p>
                    <p className="text-xs text-muted">Direct cold-chain linkage for tomatoes, mangoes, citrus, avocados.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background/50">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">L</div>
                  <div>
                    <p className="text-sm font-bold">Livestock & Dairy</p>
                    <p className="text-xs text-muted">AI-driven health monitoring for cattle, goats and poultry.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background/50">
                  <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">S</div>
                  <div>
                    <p className="text-sm font-bold">Staples & Roots</p>
                    <p className="text-xs text-muted">Maize, rice, cassava and potatoes traded with transparent floor pricing.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-foreground text-background p-8 md:p-10 rounded-2xl overflow-hidden relative">
                <h3 className="font-mono text-xs uppercase tracking-[0.2em] opacity-50 mb-8">
                  Market Opportunity (TAM)
                </h3>
                <div className="space-y-8">
                  {[
                    { v: "$200B", label: "Annual Smallholder Output", w: "100%", color: "bg-primary" },
                    { v: "50M", label: "Farmers in East Africa", w: "65%", color: "bg-accent" },
                    { v: "$150M", label: "Y3 Serviceable Produce Sales", w: "40%", color: "bg-primary/70" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-4xl font-display italic">{row.v}</span>
                        <span className="text-xs font-mono opacity-50">{row.label}</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color}`} style={{ width: row.w }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4 block">
              The Ecosystem
            </span>
            <h2 className="font-display text-4xl md:text-5xl text-balance">
              Three gaps. <span className="italic text-accent">One farmer.</span> One platform.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.n}
                className="group p-8 border border-border rounded-2xl hover:border-primary transition-all bg-card"
              >
                <div
                  className={`mb-6 size-12 rounded-lg flex items-center justify-center font-bold ${
                    f.tone === "accent" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                  }`}
                >
                  {f.n}
                </div>
                <h3 className="font-display text-2xl mb-4">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link
              to="/ecosystem"
              className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-primary hover:text-accent transition-colors"
            >
              Explore the full ecosystem →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-accent text-accent-foreground py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl mb-6">
                Fueling the <span className="italic">Harvest</span>
              </h2>
              <p className="text-background/70 text-lg mb-8 max-w-md">
                We are seeking $3.5M in equity to scale our engineering, refine our crop and
                livestock models, and onboard our next 50,000 farmers.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/investment"
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold hover:bg-primary/90 transition-all"
                >
                  View Investment Thesis
                </Link>
                <Link
                  to="/contact"
                  className="border border-background/20 px-6 py-3 rounded-full text-sm font-bold hover:bg-background/10 transition-all"
                >
                  Request Deck
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {[
                ["AI / ML Development", "$1,100,000"],
                ["Engineering & Backend", "$700,000"],
                ["Acquisition & Training", "$600,000"],
                ["Partnerships & Logistics", "$500,000"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between items-center py-4 border-b border-background/15"
                >
                  <span className="font-mono text-sm">{k}</span>
                  <span className="font-mono text-sm font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

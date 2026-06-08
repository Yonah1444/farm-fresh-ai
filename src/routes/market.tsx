import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Market & Business Model — AgriConnect AI" },
      {
        name: "description",
        content:
          "TAM of 50M smallholders and $200B annual output. Diversified revenue streams across marketplace, agrovet, expert booking, premium and data.",
      },
      { property: "og:title", content: "Market & Business Model — AgriConnect AI" },
      { property: "og:description", content: "$4.8M Y3 revenue, 58% gross margin, break-even Month 21." },
    ],
  }),
  component: MarketPage,
});

const revenue = [
  ["Marketplace commission", "3–5% of transaction value", "Buyer pays"],
  ["Agrovet commission", "8–12% of product sale", "Agrovet pays"],
  ["Vet / agronomist leads", "$0.50–1 per booking", "Professional pays"],
  ["Premium crop analytics", "$2–5 / month per farmer", "Farmer (optional)"],
  ["Data insights", "Licensing fee", "Agri-input corporates"],
];

const roadmap = [
  ["Months 1–6", "Build MVP; onboard 500 farmers (tomatoes, onions, bananas, maize, poultry); 50 agrovets."],
  ["Months 7–12", "Launch AI diagnosis for 5 vegetables + 3 fruits + 2 staples + poultry; marketplace live; 5,000 farmers."],
  ["Months 13–18", "Expand AI to 10 vegetables, 6 fruits, cattle and goats; tele-vet; 20,000 farmers."],
];

function MarketPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <header className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-6 block">
            Market & Business Model
          </span>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-balance mb-8">
            A <span className="italic text-accent">$200B</span> opportunity, owned by middlemen.
          </h1>
          <p className="text-lg text-muted max-w-[55ch] leading-relaxed">
            Smallholders produce 80% of food in emerging markets. Vegetables and fruits — 40% of
            output by value — suffer the steepest losses and the weakest market linkage. That is our
            beachhead.
          </p>
        </div>
      </header>

      {/* TAM/SAM/SOM */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { tag: "TAM", v: "50M farmers", body: "Smallholders across East Africa, generating $200B in annual produce and livestock output." },
              { tag: "SAM", v: "8M farmers", body: "Mobile-reachable smallholders growing vegetables, fruits, staples or raising livestock." },
              { tag: "SOM", v: "500k farmers", body: "Year 3 reach — representing $150M in annual produce sales on the platform." },
            ].map((b) => (
              <div key={b.tag} className="p-8 bg-card border border-border rounded-2xl">
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary">{b.tag}</span>
                <p className="font-display text-4xl my-4">{b.v}</p>
                <p className="text-sm text-muted leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue table */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl mb-12 max-w-2xl">
            Five revenue streams. <span className="italic text-primary">One platform.</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-background/50 font-mono">
                  <th className="py-4 font-medium">Stream</th>
                  <th className="py-4 font-medium">Fee / Margin</th>
                  <th className="py-4 font-medium text-right">Payer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background/10">
                {revenue.map(([s, f, p]) => (
                  <tr key={s}>
                    <td className="py-5 font-display text-lg">{s}</td>
                    <td className="py-5 font-mono text-sm text-background/70">{f}</td>
                    <td className="py-5 font-mono text-sm text-background/70 text-right">{p}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16 pt-12 border-t border-background/10">
            {[
              ["$4.8M", "Year 3 Revenue"],
              ["58%", "Gross Margin"],
              ["Month 21", "Break-even"],
            ].map(([v, l]) => (
              <div key={l}>
                <p className="font-display italic text-5xl mb-2">{v}</p>
                <p className="text-[10px] uppercase tracking-widest text-background/50 font-mono">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl mb-12 max-w-2xl">
            The first <span className="italic text-accent">18 months.</span>
          </h2>
          <ol className="space-y-px bg-border border border-border rounded-2xl overflow-hidden">
            {roadmap.map(([period, milestone]) => (
              <li key={period} className="bg-card p-8 md:flex md:items-baseline md:gap-12">
                <span className="font-mono text-sm text-primary md:w-40 shrink-0">{period}</span>
                <p className="text-base text-foreground leading-relaxed">{milestone}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-muted">
            <span className="font-bold text-foreground">LOIs secured:</span> 2 farmer cooperatives
            (3,000 farmers growing vegetables/fruits) + 1 national agrovet chain (120 outlets).
          </p>
        </div>
      </section>

      <section className="py-24 bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-6">
            Ready to see the <span className="italic">ask?</span>
          </h2>
          <Link
            to="/investment"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold hover:bg-primary/90"
          >
            Investment Thesis →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

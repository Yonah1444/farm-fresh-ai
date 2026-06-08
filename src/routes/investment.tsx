import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/investment")({
  head: () => ({
    meta: [
      { title: "Investment Thesis — AgriConnect AI" },
      {
        name: "description",
        content:
          "$3.5M Series A. 24 months runway to 50,000 farmers and $4.8M annual revenue. Use of funds, competitive advantage and risk mitigation.",
      },
      { property: "og:title", content: "Investment Thesis — AgriConnect AI" },
      {
        property: "og:description",
        content: "Strategic exit potential: agri-input multinational (Bayer, Syngenta) or telco (Safaricom).",
      },
    ],
  }),
  component: InvestmentPage,
});

const funds: [string, number][] = [
  ["AI / ML — crop models for 20+ produce types + livestock", 1_100_000],
  ["App & backend engineering", 700_000],
  ["Farmer acquisition & training", 600_000],
  ["Partnerships (vets, agronomists, agrovets, buyers)", 300_000],
  ["Logistics & payments", 200_000],
  ["Operations & legal", 400_000],
  ["Monitoring & evaluation", 150_000],
  ["Contingency", 150_000],
];

const competitors = [
  ["Twiga Foods", "Fresh-produce marketplace only — no AI, vet or input layer."],
  ["PlantVillage", "Crop diagnosis only — no marketplace, livestock or inputs."],
  ["FarmCrowdy", "Financing only — no health or produce market linkage."],
  ["AgriConnect AI", "All-in-one: market + AI + inputs + finance, across all produce."],
];

const risks = [
  ["Perishable produce logistics", "Cold-chain partnerships; local markets first."],
  ["AI misdiagnosis", "Separate models per crop family; human agronomist in the loop."],
  ["Low digital literacy", "Voice chatbot, USSD, in-person demos."],
  ["Offline areas", "On-device lightweight models with later sync."],
];

const total = funds.reduce((s, [, v]) => s + v, 0);

function InvestmentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <header className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-6 block">
            Investment Thesis
          </span>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-balance mb-8">
            $3.5M to build the <span className="italic text-accent">infrastructure</span> of African food security.
          </h1>
          <p className="text-lg text-muted max-w-[55ch] leading-relaxed">
            Equity or convertible note. 24 months runway. Path to 50,000 farmers and $4.8M annual
            revenue. Strategic exit through agri-input multinationals or regional telcos.
          </p>
        </div>
      </header>

      {/* Use of Funds */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-baseline justify-between mb-10 flex-wrap gap-4">
            <h2 className="font-display text-4xl">Use of Funds</h2>
            <p className="font-mono text-sm text-muted">
              Total: <span className="text-foreground font-bold">${total.toLocaleString()}</span>
            </p>
          </div>
          <div className="space-y-3">
            {funds.map(([label, amount]) => {
              const pct = (amount / total) * 100;
              return (
                <div key={label}>
                  <div className="flex justify-between items-baseline mb-2 gap-4">
                    <span className="text-sm md:text-base font-medium">{label}</span>
                    <span className="font-mono text-sm shrink-0">${amount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Competitive */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl mb-12 max-w-2xl">
            Competitive <span className="italic text-accent">advantage.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {competitors.map(([name, edge], i) => {
              const us = i === competitors.length - 1;
              return (
                <div
                  key={name}
                  className={`p-8 rounded-2xl border ${
                    us ? "bg-accent text-accent-foreground border-accent" : "bg-card border-border"
                  }`}
                >
                  <p className={`font-mono text-[10px] uppercase tracking-widest mb-3 ${us ? "text-primary" : "text-muted"}`}>
                    {us ? "Our position" : "Competitor"}
                  </p>
                  <h3 className="font-display text-2xl mb-3">{name}</h3>
                  <p className={`text-sm leading-relaxed ${us ? "text-background/80" : "text-muted"}`}>
                    {edge}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Risks */}
      <section className="py-24 bg-foreground text-background">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl mb-12 max-w-2xl">
            Risk <span className="italic text-primary">mitigation.</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-px bg-background/10 rounded-2xl overflow-hidden border border-background/10">
            {risks.map(([risk, mit]) => (
              <div key={risk} className="bg-foreground p-8">
                <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-3">Risk</p>
                <p className="font-display text-xl mb-4">{risk}</p>
                <p className="text-sm text-background/70 leading-relaxed">{mit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-6 text-center max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl mb-6">
            Become a <span className="italic">lead investor.</span>
          </h2>
          <p className="text-background/70 mb-8">
            Full financial model, technical architecture, LOIs and team bios available on request.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm font-bold hover:bg-primary/90"
          >
            Access the Data Room →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

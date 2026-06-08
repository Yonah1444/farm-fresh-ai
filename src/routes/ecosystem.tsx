import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/ecosystem")({
  head: () => ({
    meta: [
      { title: "Ecosystem — AgriConnect AI" },
      {
        name: "description",
        content:
          "Marketplace, AI diagnosis, chatbot, vet & agronomist network, agrovet e-commerce and finance — for vegetables, fruits, staples and livestock.",
      },
      { property: "og:title", content: "Ecosystem — AgriConnect AI" },
      {
        property: "og:description",
        content: "One platform for every farm product, every farmer, every input.",
      },
    ],
  }),
  component: EcosystemPage,
});

const pillars = [
  {
    title: "Marketplace for every farm product",
    body: "Farmers list vegetables (tomatoes, onions, leafy greens), fruits (mangoes, bananas, citrus, avocados), grains (maize, rice), roots (cassava, potatoes), and livestock products (milk, eggs, meat, hides). Buyers include retailers, processors, exporters and hotels.",
  },
  {
    title: "AI disease diagnosis — crops & livestock",
    body: "Photo of a sick plant or animal → ML model identifies disease/pest → recommends treatment → links directly to a verified agrovet. Supports all major vegetables and fruits.",
  },
  {
    title: "Multilingual chatbot",
    body: "Text and voice queries answered instantly. 60% resolved without human expert. Example: ‘My tomatoes have black spots on fruit’ → possible early blight or anthracnose.",
  },
  {
    title: "Vet & Agronomist Network",
    body: "Telemedicine plus physical visits. Booking and payment in-app. Agronomists specialized in vegetables, fruits, staples or livestock.",
  },
  {
    title: "Agrovet Directory & E-Commerce",
    body: "Verified agrovets sell crop protection, seeds, fertilizers, veterinary drugs and feeds with transparent pricing and delivery.",
  },
  {
    title: "Financial Inclusion",
    body: "Transaction history powers microloans and index-based insurance for drought and pest outbreaks.",
  },
];

const objectives = [
  ["Fair pricing", "Avg selling price ≥15% above local market floor; 5,000+ buyers by Y2."],
  ["Healthier farming", "30% fewer post-harvest losses on perishables; 50% lower livestock mortality."],
  ["Expert access", "≤24h vet/agronomist response; 500+ professionals onboarded by Y2."],
  ["Input access", "1,000+ agrovets, 20% lower input costs for farmers."],
  ["AI accuracy", "85% diagnosis accuracy across the top 20 produce items + major livestock."],
  ["Financial empowerment", "50% digital transactions; 10,000 farmers accessing credit."],
];

function EcosystemPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      <header className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6 max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-6 block">
            The Ecosystem
          </span>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] text-balance mb-8">
            A unified <span className="italic text-accent">nervous system</span> for the modern smallholder.
          </h1>
          <p className="text-lg text-muted max-w-[55ch] leading-relaxed">
            Six interlocking capabilities, one mobile-first platform — Android, WhatsApp chatbot and
            USSD — purpose-built for vegetables, fruits, staples and livestock.
          </p>
        </div>
      </header>

      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {pillars.map((p, i) => (
              <div key={p.title} className="bg-card p-8 md:p-10">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-mono text-xs text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl">{p.title}</h3>
                </div>
                <p className="text-sm text-muted leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-4xl mb-12 max-w-2xl">
            How we measure <span className="italic text-accent">success.</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {objectives.map(([k, v]) => (
              <div key={k} className="border-t border-border pt-6">
                <p className="font-display text-2xl mb-3">{k}</p>
                <p className="text-sm text-muted leading-relaxed">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-6">
            Want to see the <span className="italic">economics?</span>
          </h2>
          <Link
            to="/market"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold hover:bg-primary/90"
          >
            Market & Business Model →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

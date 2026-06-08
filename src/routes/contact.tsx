import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — AgriConnect AI" },
      {
        name: "description",
        content:
          "Request the AgriConnect AI investor data room: pitch deck, financial model, technical architecture and LOIs.",
      },
      { property: "og:title", content: "Contact — AgriConnect AI" },
      { property: "og:description", content: "Access the investor data room." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteNav />

      <main className="flex-1 py-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-6 block">
              Connect
            </span>
            <h1 className="font-display text-5xl md:text-6xl leading-[0.95] text-balance mb-8">
              Let's grow this <span className="italic text-accent">together.</span>
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-10 max-w-md">
              For investors, partner cooperatives, agrovets and agronomists. Tell us a little about
              who you are and we'll be in touch within 48 hours.
            </p>

            <dl className="space-y-6 border-t border-border pt-8">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Headquarters</dt>
                <dd className="font-display text-xl">Nairobi, Kenya</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Investor relations</dt>
                <dd className="font-display text-xl">invest@agriconnect.ai</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted mb-1">Partnerships</dt>
                <dd className="font-display text-xl">partners@agriconnect.ai</dd>
              </div>
            </dl>
          </div>

          <div className="bg-accent text-accent-foreground p-10 md:p-12 rounded-3xl">
            <h2 className="text-center font-display text-3xl mb-8 italic">
              Connect with the founders
            </h2>
            {sent ? (
              <div className="text-center py-12">
                <p className="font-display text-2xl mb-2">Thank you.</p>
                <p className="text-background/70">We'll be in touch shortly.</p>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <input
                  required
                  type="text"
                  placeholder="Name / Firm"
                  className="w-full bg-background/10 border border-background/15 rounded-lg px-4 py-3 text-sm placeholder:text-background/40 focus:outline-none focus:border-primary"
                />
                <input
                  required
                  type="email"
                  placeholder="Professional email"
                  className="w-full bg-background/10 border border-background/15 rounded-lg px-4 py-3 text-sm placeholder:text-background/40 focus:outline-none focus:border-primary"
                />
                <select
                  className="w-full bg-background/10 border border-background/15 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary"
                  defaultValue=""
                >
                  <option value="" disabled className="text-foreground">I am a…</option>
                  <option className="text-foreground">Investor</option>
                  <option className="text-foreground">Cooperative / farmer group</option>
                  <option className="text-foreground">Agrovet / input supplier</option>
                  <option className="text-foreground">Vet / agronomist</option>
                  <option className="text-foreground">Other</option>
                </select>
                <textarea
                  placeholder="Tell us a little more"
                  rows={4}
                  className="w-full bg-background/10 border border-background/15 rounded-lg px-4 py-3 text-sm placeholder:text-background/40 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-bold hover:bg-primary/90 transition-all"
                >
                  Request Access
                </button>
                <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-background/40">
                  Audited financials available on request
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

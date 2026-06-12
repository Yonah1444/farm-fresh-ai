import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sprout, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { startConversation } from "@/lib/chat.functions";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace — AgriConnect AI" },
      {
        name: "description",
        content:
          "Browse fresh produce, livestock, and dairy direct from verified African smallholder farmers.",
      },
    ],
  }),
  component: Marketplace,
});

type Listing = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  currency: string | null;
  description: string | null;
  location: string | null;
  image_path: string | null;
  created_at: string;
};

const CATEGORIES = ["all", "vegetable", "fruit", "staple", "livestock", "dairy", "other"] as const;

function Marketplace() {
  const navigate = useNavigate();
  const startFn = useServerFn(startConversation);
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [me, setMe] = useState<string | null>(null);
  const [contacting, setContacting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: u }] = await Promise.all([
        supabase
          .from("listings")
          .select("id,user_id,title,category,quantity,unit,price,currency,description,location,image_path,created_at")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(120),
        supabase.auth.getUser(),
      ]);
      setRows(data ?? []);
      setMe(u.user?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (cat !== "all" && r.category !== cat) return false;
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, cat, search]);

  function imgUrl(path: string | null) {
    if (!path) return null;
    return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
  }

  async function contact(listingId: string) {
    if (!me) {
      toast.message("Sign in to message the farmer");
      navigate({ to: "/auth" });
      return;
    }
    setContacting(listingId);
    try {
      const r = (await startFn({ data: { listing_id: listingId } })) as { id: string };
      navigate({ to: "/messages/$id", params: { id: r.id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start chat");
    } finally {
      setContacting(null);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Marketplace</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mt-3">
            Direct from the farm.
          </h1>
          <p className="text-muted mt-4 max-w-2xl">
            Browse produce, livestock, and dairy from verified farmers across the region. Chat directly with farmers to negotiate price and pickup.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Input
              placeholder="Search produce, livestock…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={80}
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-colors ${
                    cat === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted hover:text-primary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <Link
              to="/listings"
              className="ml-auto text-sm font-bold text-accent hover:underline"
            >
              I'm a farmer → list produce
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-muted">Loading listings…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted">No listings match your filters yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((l) => {
              const img = imgUrl(l.image_path);
              const isOwn = me === l.user_id;
              return (
                <Card key={l.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-[4/3] bg-muted/10 overflow-hidden">
                    {img ? (
                      <img src={img} alt={l.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Sprout className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-5 space-y-2 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg leading-tight">{l.title}</h3>
                      <span className="text-xs uppercase tracking-wider text-accent">{l.category}</span>
                    </div>
                    {l.price != null && (
                      <p className="text-xl font-bold text-primary">
                        {l.currency ?? "KES"} {Number(l.price).toLocaleString()}
                        {l.unit && <span className="text-sm text-muted font-normal"> / {l.unit}</span>}
                      </p>
                    )}
                    {l.quantity != null && (
                      <p className="text-sm text-muted">
                        Available: {l.quantity} {l.unit ?? ""}
                      </p>
                    )}
                    {l.description && (
                      <p className="text-sm text-foreground/80 line-clamp-3">{l.description}</p>
                    )}
                    {l.location && (
                      <p className="text-xs text-muted flex items-center gap-1 pt-1">
                        <MapPin className="h-3 w-3" /> {l.location}
                      </p>
                    )}
                    <div className="pt-3 mt-auto">
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isOwn || contacting === l.id}
                        onClick={() => contact(l.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {isOwn ? "Your listing" : contacting === l.id ? "Opening…" : "Message farmer"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

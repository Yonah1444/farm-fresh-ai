import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Sprout, Search, ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { placeOrder } from "@/lib/orders.functions";

const CART_KEY = "agrovet_cart_v1";
type CartItem = { product_id: string; quantity: number };

export const Route = createFileRoute("/agrovet")({
  head: () => ({
    meta: [
      { title: "Agrovet Inputs — Seeds, Fertilizer, Feeds | AgriConnect AI" },
      {
        name: "description",
        content:
          "Browse verified agrovet inputs: seeds, fertilizers, pesticides, and animal feeds from suppliers across the region.",
      },
      { property: "og:title", content: "Agrovet Inputs Catalog — AgriConnect AI" },
      {
        property: "og:description",
        content: "Compare prices and stock on seeds, fertilizer, pesticides and feeds.",
      },
    ],
  }),
  component: AgrovetCatalog,
});

type Product = {
  id: string;
  agrovet_id: string;
  name: string;
  category: "seed" | "fertilizer" | "pesticide" | "feed" | "equipment" | "other";
  description: string | null;
  price_kes: number;
  unit: string;
  stock: number;
  image_path: string | null;
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "seed", label: "Seeds" },
  { value: "fertilizer", label: "Fertilizers" },
  { value: "pesticide", label: "Pesticides" },
  { value: "feed", label: "Feeds" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
] as const;

function AgrovetCatalog() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("agrovet_products")
      .select("id,agrovet_id,name,category,description,price_kes,unit,stock,image_path")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as Product[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          (p.description ?? "").toLowerCase().includes(needle)),
    );
  }, [items, q, cat]);

  const imgUrl = (path: string | null) => {
    if (!path) return null;
    return supabase.storage.from("agrovet-products").getPublicUrl(path).data.publicUrl;
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <Sprout className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-display font-bold">Agrovet Input Catalog</h1>
          </div>
          <p className="text-muted max-w-2xl">
            Seeds, fertilizers, pesticides and feeds from verified suppliers. Compare prices, check
            stock, and contact agrovets directly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="pl-9"
              />
            </div>
            <Link to="/auth" className="text-sm text-muted hover:text-primary">
              Are you an agrovet? <span className="font-semibold">Sign in to list →</span>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCat(c.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  cat === c.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-muted">Loading catalog…</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted">No products match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((p) => {
              const url = imgUrl(p.image_path);
              return (
                <Card key={p.id} className="overflow-hidden flex flex-col">
                  <div className="aspect-square bg-muted/10 flex items-center justify-center overflow-hidden">
                    {url ? (
                      <img src={url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Sprout className="w-12 h-12 text-muted/40" />
                    )}
                  </div>
                  <CardContent className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{p.name}</h3>
                      <Badge variant="secondary" className="capitalize shrink-0">
                        {p.category}
                      </Badge>
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted line-clamp-2">{p.description}</p>
                    )}
                    <div className="mt-auto pt-2 flex items-end justify-between">
                      <div>
                        <div className="text-lg font-bold text-primary">
                          KES {p.price_kes.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted">per {p.unit}</div>
                      </div>
                      <div className="text-xs text-muted">
                        {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                      </div>
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

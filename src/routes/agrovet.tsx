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
import { Sprout, Search, ShoppingCart, Plus, Minus, Trash2, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { placeOrder } from "@/lib/orders.functions";
import { createQuoteRequest } from "@/lib/quotes.functions";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

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
  const navigate = useNavigate();
  const submitOrder = useServerFn(placeOrder);
  const submitQuote = useServerFn(createQuoteRequest);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [quoteFor, setQuoteFor] = useState<Product | null>(null);
  const [qQty, setQQty] = useState("1");
  const [qMsg, setQMsg] = useState("");
  const [qPhone, setQPhone] = useState("");
  const [qSending, setQSending] = useState(false);

  useEffect(() => {
    void load();
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

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

  const cartLines = useMemo(
    () =>
      cart
        .map((c) => {
          const p = items.find((i) => i.id === c.product_id);
          return p ? { product: p, quantity: c.quantity } : null;
        })
        .filter((x): x is { product: Product; quantity: number } => x !== null),
    [cart, items],
  );
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cartLines.reduce((s, l) => s + l.product.price_kes * l.quantity, 0);

  function addToCart(p: Product) {
    if (p.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock) {
          toast.error(`Only ${p.stock} in stock`);
          return prev;
        }
        return prev.map((c) =>
          c.product_id === p.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { product_id: p.id, quantity: 1 }];
    });
    toast.success(`Added ${p.name}`);
  }

  function setQty(product_id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product_id !== product_id) return c;
          const p = items.find((i) => i.id === product_id);
          const max = p?.stock ?? c.quantity;
          return { ...c, quantity: Math.min(max, Math.max(0, c.quantity + delta)) };
        })
        .filter((c) => c.quantity > 0),
    );
  }

  function removeLine(product_id: string) {
    setCart((prev) => prev.filter((c) => c.product_id !== product_id));
  }

  async function handlePlaceOrder() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast.error("Sign in to place an order");
      navigate({ to: "/auth" });
      return;
    }
    if (cart.length === 0) return;
    if (phone.trim().length < 7) {
      toast.error("Enter a valid contact phone");
      return;
    }
    setPlacing(true);
    try {
      const res = (await submitOrder({
        data: {
          contact_phone: phone.trim(),
          delivery_notes: notes.trim() || null,
          items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
        },
      })) as { orders: Array<{ id: string }> };
      toast.success(`Order placed (${res.orders.length} ${res.orders.length === 1 ? "supplier" : "suppliers"})`);
      setCart([]);
      setCartOpen(false);
      setPhone("");
      setNotes("");
      navigate({ to: "/orders" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Sprout className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-display font-bold">Agrovet Input Catalog</h1>
            </div>
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative shrink-0">
                  <ShoppingCart className="w-4 h-4" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center bg-primary text-primary-foreground rounded-full text-xs w-5 h-5">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col">
                <SheetHeader>
                  <SheetTitle>Your cart</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4 space-y-3">
                  {cartLines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                  ) : (
                    cartLines.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 border border-border rounded-lg p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            KES {product.price_kes.toLocaleString()} / {product.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(product.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(product.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeLine(product.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {cartLines.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">KES {cartTotal.toLocaleString()}</span>
                    </div>
                    <div>
                      <Label htmlFor="phone">Contact phone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+254 7XX XXX XXX"
                        maxLength={30}
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Delivery notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Pickup time, delivery address…"
                        maxLength={1000}
                        rows={3}
                      />
                    </div>
                    <SheetFooter>
                      <Button className="w-full" onClick={handlePlaceOrder} disabled={placing}>
                        {placing ? "Placing…" : "Place order"}
                      </Button>
                    </SheetFooter>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
          <p className="text-muted max-w-2xl">
            Seeds, fertilizers, pesticides and feeds from verified suppliers. Compare prices, check
            stock, add items to your cart and place an order.
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
            <Link to="/orders" className="text-sm text-muted hover:text-primary">
              My orders →
            </Link>
            <Link to="/quotes" className="text-sm text-muted hover:text-primary">
              My quotes →
            </Link>
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
              const inCart = cart.find((c) => c.product_id === p.id);
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
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      disabled={p.stock <= 0}
                      onClick={() => addToCart(p)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {inCart ? `In cart (${inCart.quantity})` : p.stock > 0 ? "Add to cart" : "Out of stock"}
                    </Button>
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


import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Pencil, X } from "lucide-react";
import { upsertListing, deleteListing, listMyListings } from "@/lib/listings.functions";

export const Route = createFileRoute("/_authenticated/listings")({
  head: () => ({ meta: [{ title: "My Listings — AgriConnect AI" }] }),
  component: MyListings,
});

type Farm = { id: string; name: string };
type Listing = {
  id: string;
  farm_id: string;
  title: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  price: number | null;
  currency: string | null;
  description: string | null;
  location: string | null;
  status: string;
  image_path: string | null;
  created_at: string;
  farms?: { name: string } | null;
};

const CATS = ["vegetable", "fruit", "staple", "livestock", "dairy", "other"] as const;
const STATUSES = ["active", "sold", "draft"] as const;

function MyListings() {
  const upsertFn = useServerFn(upsertListing);
  const deleteFn = useServerFn(deleteListing);
  const listFn = useServerFn(listMyListings);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [rows, setRows] = useState<Listing[]>([]);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data: f } = await supabase.from("farms").select("id, name").order("created_at");
    setFarms(f ?? []);
    const r = (await listFn()) as Listing[];
    setRows(r);
  }
  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing(null);
    setShowForm(true);
  }
  function startEdit(l: Listing) {
    setEditing(l);
    setShowForm(true);
  }
  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing?")) return;
    try {
      await deleteFn({ data: { id } });
      setRows((r) => r.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      let imagePath = editing?.image_path ?? null;
      const file = form.get("photo") as File | null;
      if (file && file.size > 0) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Image too large (max 5MB)");
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Use a JPEG, PNG, or WEBP image");
        }
        const { data: u } = await supabase.auth.getUser();
        const uid = u.user?.id;
        if (!uid) throw new Error("Not signed in");
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("listings")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        imagePath = path;
      }

      const priceStr = String(form.get("price") ?? "").trim();
      const qtyStr = String(form.get("quantity") ?? "").trim();

      const payload = {
        id: editing?.id,
        farm_id: String(form.get("farm_id") ?? ""),
        title: String(form.get("title") ?? "").trim(),
        category: String(form.get("category") ?? "other") as (typeof CATS)[number],
        quantity: qtyStr ? Number(qtyStr) : null,
        unit: (String(form.get("unit") ?? "").trim() || null),
        price: priceStr ? Number(priceStr) : null,
        currency: String(form.get("currency") ?? "KES").trim() || "KES",
        description: (String(form.get("description") ?? "").trim() || null),
        location: (String(form.get("location") ?? "").trim() || null),
        status: String(form.get("status") ?? "active") as (typeof STATUSES)[number],
        image_path: imagePath,
      };

      await upsertFn({ data: payload });
      toast.success(editing ? "Listing updated" : "Listing published");
      closeForm();
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function imgUrl(path: string | null) {
    if (!path) return null;
    return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <Link to="/marketplace" className="text-sm font-bold text-accent hover:underline">
            View public marketplace →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">My listings</h1>
            <p className="text-muted mt-2">List produce, livestock, and dairy for buyers to discover.</p>
          </div>
          {!showForm && (
            <Button onClick={startNew} disabled={farms.length === 0}>
              <Plus className="h-4 w-4" /> New listing
            </Button>
          )}
        </div>

        {farms.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-muted">
              Add a farm in the <Link to="/dashboard" className="text-accent underline">dashboard</Link> before creating listings.
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{editing ? "Edit listing" : "New listing"}</CardTitle>
                <CardDescription>Buyers see active listings on the public marketplace.</CardDescription>
              </div>
              <button onClick={closeForm} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={editing?.title ?? ""} maxLength={120} required />
                </div>
                <div>
                  <Label htmlFor="farm_id">Farm</Label>
                  <select
                    id="farm_id" name="farm_id" required defaultValue={editing?.farm_id ?? farms[0]?.id ?? ""}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category" name="category" defaultValue={editing?.category ?? "vegetable"}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" step="any" min="0" defaultValue={editing?.quantity ?? ""} />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" name="unit" placeholder="kg, crate, head" defaultValue={editing?.unit ?? ""} maxLength={20} />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="any" min="0" defaultValue={editing?.price ?? ""} />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" name="currency" defaultValue={editing?.currency ?? "KES"} maxLength={8} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="location">Pickup location</Label>
                  <Input id="location" name="location" defaultValue={editing?.location ?? ""} maxLength={120} placeholder="Kiambu, Kenya" />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editing?.description ?? ""} maxLength={2000} rows={3} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status" name="status" defaultValue={editing?.status ?? "active"}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label htmlFor="photo">Photo {editing?.image_path && <span className="text-muted text-xs">(leave empty to keep)</span>}</Label>
                  <input
                    id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp"
                    className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-2 file:text-sm file:font-medium"
                  />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Publish listing"}</Button>
                  <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((l) => {
            const img = imgUrl(l.image_path);
            return (
              <Card key={l.id} className="overflow-hidden">
                {img && <img src={img} alt={l.title} className="aspect-[4/3] w-full object-cover" />}
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{l.title}</h3>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      l.status === "active" ? "bg-primary/10 text-primary" :
                      l.status === "sold" ? "bg-accent/10 text-accent" :
                      "bg-muted/20 text-muted"
                    }`}>{l.status}</span>
                  </div>
                  <p className="text-xs uppercase tracking-wider text-muted">{l.category} • {l.farms?.name}</p>
                  {l.price != null && <p className="font-bold text-primary">{l.currency ?? "KES"} {Number(l.price).toLocaleString()}{l.unit && <span className="text-xs text-muted font-normal"> / {l.unit}</span>}</p>}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(l)}><Pencil className="h-3 w-3" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(l.id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

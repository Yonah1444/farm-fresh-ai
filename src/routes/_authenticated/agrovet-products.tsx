import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  upsertAgrovetProduct,
  deleteAgrovetProduct,
  listMyAgrovetProducts,
  setMyRole,
  getMyRoles,
} from "@/lib/agrovet.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Sprout, Pencil } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agrovet-products")({
  head: () => ({ meta: [{ title: "Manage Agrovet Products — AgriConnect AI" }] }),
  component: ManageAgrovet,
});

type Product = {
  id: string;
  name: string;
  category: "seed" | "fertilizer" | "pesticide" | "feed" | "equipment" | "other";
  description: string | null;
  price_kes: number;
  unit: string;
  stock: number;
  active: boolean;
  image_path: string | null;
};

function ManageAgrovet() {
  const router = useRouter();
  const { user } = Route.useRouteContext();
  const list = useServerFn(listMyAgrovetProducts);
  const upsert = useServerFn(upsertAgrovetProduct);
  const remove = useServerFn(deleteAgrovetProduct);
  const claim = useServerFn(setMyRole);
  const fetchRoles = useServerFn(getMyRoles);

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAgrovet, setIsAgrovet] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const roles = (await fetchRoles()) as string[];
      const isA = roles.includes("agrovet");
      setIsAgrovet(isA);
      if (isA) {
        const data = (await list()) as Product[];
        setItems(data);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
    setLoading(false);
  }

  async function becomeAgrovet() {
    try {
      await claim({ data: { role: "agrovet" } });
      toast.success("You're now registered as an agrovet supplier.");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function openNew() {
    setEditing(null);
    setFile(null);
    setShowForm(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setFile(null);
    setShowForm(true);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      let imagePath = editing?.image_path ?? null;
      if (file) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("agrovet-products")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        imagePath = path;
      }
      await upsert({
        data: {
          id: editing?.id,
          name: String(fd.get("name") ?? ""),
          category: fd.get("category") as Product["category"],
          description: String(fd.get("description") ?? "") || null,
          price_kes: Number(fd.get("price_kes") ?? 0),
          unit: String(fd.get("unit") ?? "unit"),
          stock: Number(fd.get("stock") ?? 0),
          active: fd.get("active") === "on",
          image_path: imagePath,
        },
      });
      toast.success(editing ? "Product updated" : "Product added");
      setShowForm(false);
      setEditing(null);
      setFile(null);
      await load();
      router.invalidate();
    } catch (err) {
      toast.error((err as Error).message);
    }
    setSaving(false);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const imgUrl = (path: string | null) =>
    path ? supabase.storage.from("agrovet-products").getPublicUrl(path).data.publicUrl : null;

  if (loading) return <div className="p-10 text-muted">Loading…</div>;

  if (!isAgrovet) {
    return (
      <main className="max-w-2xl mx-auto p-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-primary" /> Become an Agrovet Supplier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted">
              List seeds, fertilizers, pesticides, feeds and equipment for farmers across the
              region. You'll manage your own products, prices, and stock.
            </p>
            <Button onClick={becomeAgrovet}>Register as Agrovet</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">My Agrovet Products</h1>
          <p className="text-muted text-sm">Manage your input catalog.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> Add product
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit product" : "New product"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={editing?.name ?? ""} required maxLength={140} />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={editing?.category ?? "seed"}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="seed">Seed</option>
                  <option value="fertilizer">Fertilizer</option>
                  <option value="pesticide">Pesticide</option>
                  <option value="feed">Feed</option>
                  <option value="equipment">Equipment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="unit">Unit (e.g. kg, bag, litre)</Label>
                <Input id="unit" name="unit" defaultValue={editing?.unit ?? "unit"} maxLength={20} />
              </div>
              <div>
                <Label htmlFor="price_kes">Price (KES)</Label>
                <Input id="price_kes" name="price_kes" type="number" step="0.01" min="0" defaultValue={editing?.price_kes ?? ""} required />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" name="stock" type="number" min="0" defaultValue={editing?.stock ?? 0} required />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description ?? ""} maxLength={2000} rows={3} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="photo">
                  Photo {editing?.image_path && <span className="text-muted text-xs">(leave empty to keep)</span>}
                </Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <label className="flex items-center gap-2 md:col-span-2">
                <Switch name="active" defaultChecked={editing?.active ?? true} />
                <span className="text-sm">Active (visible in public catalog)</span>
              </label>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update product" : "Add product"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {items.length === 0 ? (
        <p className="text-muted">No products yet. Add your first product to start selling.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const url = imgUrl(p.image_path);
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="aspect-video bg-muted/10 flex items-center justify-center">
                  {url ? (
                    <img src={url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Sprout className="w-10 h-10 text-muted/40" />
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.name}</h3>
                    <Badge variant={p.active ? "default" : "secondary"} className="capitalize">
                      {p.active ? p.category : "hidden"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted">
                    KES {p.price_kes.toLocaleString()} / {p.unit} · {p.stock} in stock
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

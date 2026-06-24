import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  createFarmActivity, listFarmActivities, deleteFarmActivity,
} from "@/lib/farm-activities.functions";

export const Route = createFileRoute("/_authenticated/farms/$farmId/activities")({
  head: () => ({ meta: [{ title: "Farm Activity Log — AgriConnect AI" }] }),
  component: ActivitiesPage,
});

type Activity = {
  id: string;
  farm_id: string;
  type: string;
  title: string;
  notes: string | null;
  quantity: number | null;
  unit: string | null;
  cost_kes: number | null;
  occurred_at: string;
};

const TYPES = [
  "planting", "harvest", "treatment", "fertilizer",
  "irrigation", "pest_control", "vaccination", "sale", "other",
] as const;

function ActivitiesPage() {
  const { farmId } = Route.useParams();
  const fetchList = useServerFn(listFarmActivities);
  const create = useServerFn(createFarmActivity);
  const remove = useServerFn(deleteFarmActivity);

  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<typeof TYPES[number]>("planting");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchList({ data: { farm_id: farmId } });
      setItems((rows ?? []) as Activity[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [farmId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");
    setSaving(true);
    try {
      await create({
        data: {
          farm_id: farmId,
          type,
          title: title.trim(),
          notes: notes.trim() || undefined,
          quantity: quantity ? Number(quantity) : undefined,
          unit: unit.trim() || undefined,
          cost_kes: cost ? Number(cost) : undefined,
          occurred_at: new Date(date).toISOString(),
        },
      });
      toast.success("Activity logged");
      setTitle(""); setNotes(""); setQuantity(""); setUnit(""); setCost("");
      setShowForm(false);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete activity?")) return;
    try {
      await remove({ data: { id } });
      setItems((cur) => cur.filter((x) => x.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary">← Back to dashboard</Link>
          <h1 className="font-display text-3xl font-bold mt-1">Farm activity log</h1>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Log activity"}</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof TYPES[number])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" step="0.01" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, bags, liters…" maxLength={40} />
              </div>
              <div>
                <Label>Cost (KES)</Label>
                <Input type="number" step="0.01" min="0" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save activity"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No activities yet.</CardContent></Card>
      ) : (
        <ol className="relative border-l-2 border-border ml-4 space-y-4">
          {items.map((a) => (
            <li key={a.id} className="ml-6">
              <span className="absolute -left-2 w-4 h-4 bg-primary rounded-full border-2 border-background" />
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{a.type.replace("_", " ")}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.occurred_at).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-base mt-1">{a.title}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => del(a.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {(a.quantity != null || a.unit) && (
                    <div>Qty: {a.quantity ?? "—"} {a.unit ?? ""}</div>
                  )}
                  {a.cost_kes != null && <div>Cost: KES {a.cost_kes.toLocaleString()}</div>}
                  {a.notes && <p className="text-muted-foreground">{a.notes}</p>}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

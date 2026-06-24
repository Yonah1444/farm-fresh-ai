import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listMyQuotes, listIncomingQuotes, respondToQuote } from "@/lib/quotes.functions";

export const Route = createFileRoute("/_authenticated/quotes")({
  head: () => ({ meta: [{ title: "Quote Requests — AgriConnect AI" }] }),
  component: QuotesPage,
});

type Quote = {
  id: string;
  product_id: string;
  buyer_id: string;
  agrovet_id: string;
  quantity: number;
  message: string | null;
  contact_phone: string | null;
  status: string;
  quoted_price_kes: number | null;
  quoted_note: string | null;
  created_at: string;
  agrovet_products: { name: string; unit: string; image_path: string | null } | null;
};

function QuotesPage() {
  const fetchMine = useServerFn(listMyQuotes);
  const fetchIncoming = useServerFn(listIncomingQuotes);
  const respond = useServerFn(respondToQuote);
  const [mine, setMine] = useState<Quote[]>([]);
  const [incoming, setIncoming] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([fetchMine(), fetchIncoming()]);
      setMine((m ?? []) as Quote[]);
      setIncoming((i ?? []) as Quote[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-bold mb-6">Quote requests</h1>
      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My requests ({mine.length})</TabsTrigger>
          <TabsTrigger value="incoming">Incoming ({incoming.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4 space-y-3">
          {loading ? <p className="text-muted-foreground">Loading…</p> :
            mine.length === 0 ? <p className="text-muted-foreground">No quote requests yet.</p> :
            mine.map((q) => <QuoteCard key={q.id} q={q} />)}
        </TabsContent>

        <TabsContent value="incoming" className="mt-4 space-y-3">
          {loading ? <p className="text-muted-foreground">Loading…</p> :
            incoming.length === 0 ? <p className="text-muted-foreground">No incoming requests.</p> :
            incoming.map((q) => (
              <RespondCard key={q.id} q={q} onResponded={load} respond={respond} />
            ))}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function QuoteCard({ q }: { q: Quote }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{q.agrovet_products?.name ?? "Product"}</CardTitle>
          <Badge variant="secondary" className="capitalize">{q.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <div>Quantity: <strong>{q.quantity}</strong> {q.agrovet_products?.unit}</div>
        {q.message && <div className="text-muted-foreground">"{q.message}"</div>}
        {q.quoted_price_kes != null && (
          <div className="text-primary font-semibold">Quoted: KES {q.quoted_price_kes.toLocaleString()}</div>
        )}
        {q.quoted_note && <div className="text-muted-foreground">{q.quoted_note}</div>}
        <div className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

function RespondCard({
  q, onResponded, respond,
}: {
  q: Quote;
  onResponded: () => void;
  respond: ReturnType<typeof useServerFn<typeof respondToQuote>>;
}) {
  const [price, setPrice] = useState(q.quoted_price_kes?.toString() ?? "");
  const [note, setNote] = useState(q.quoted_note ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async (status: "quoted" | "declined" | "closed") => {
    setBusy(true);
    try {
      await respond({
        data: {
          id: q.id,
          status,
          quoted_price_kes: status === "quoted" && price ? Number(price) : undefined,
          quoted_note: note || undefined,
        },
      });
      toast.success("Response sent");
      onResponded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{q.agrovet_products?.name ?? "Product"}</CardTitle>
          <Badge variant="secondary" className="capitalize">{q.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm space-y-3">
        <div>Buyer wants: <strong>{q.quantity}</strong> {q.agrovet_products?.unit}</div>
        {q.message && <div className="text-muted-foreground">"{q.message}"</div>}
        {q.contact_phone && <div>Phone: {q.contact_phone}</div>}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`p-${q.id}`}>Quoted price (KES)</Label>
            <Input id={`p-${q.id}`} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label htmlFor={`n-${q.id}`}>Note</Label>
            <Textarea id={`n-${q.id}`} rows={1} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" disabled={busy} onClick={() => submit("quoted")}>Send quote</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => submit("declined")}>Decline</Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => submit("closed")}>Close</Button>
        </div>
      </CardContent>
    </Card>
  );
}

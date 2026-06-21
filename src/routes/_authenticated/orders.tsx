import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders, listIncomingOrders, updateOrderStatus } from "@/lib/orders.functions";
import { getMyRoles } from "@/lib/agrovet.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My Orders — AgriConnect AI" }] }),
  component: OrdersPage,
});

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unit_price_kes: number;
  subtotal_kes: number;
};
type Order = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "fulfilled";
  total_kes: number;
  contact_phone: string | null;
  delivery_notes: string | null;
  created_at: string;
  agrovet_id?: string;
  buyer_id?: string;
  order_items: OrderItem[];
};

const statusColor: Record<Order["status"], string> = {
  pending: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  fulfilled: "bg-green-500/15 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/15 text-red-700 dark:text-red-400",
};

function OrdersPage() {
  const router = useRouter();
  const fetchMine = useServerFn(listMyOrders);
  const fetchIncoming = useServerFn(listIncomingOrders);
  const fetchRoles = useServerFn(getMyRoles);
  const setStatus = useServerFn(updateOrderStatus);

  const [mine, setMine] = useState<Order[]>([]);
  const [incoming, setIncoming] = useState<Order[]>([]);
  const [isAgrovet, setIsAgrovet] = useState(false);
  const [tab, setTab] = useState<"mine" | "incoming">("mine");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [m, roles] = await Promise.all([fetchMine(), fetchRoles()]);
      setMine(m as Order[]);
      const agro = (roles as string[]).includes("agrovet");
      setIsAgrovet(agro);
      if (agro) setIncoming((await fetchIncoming()) as Order[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(id: string, status: Order["status"]) {
    try {
      await setStatus({ data: { id, status } });
      toast.success(`Order ${status}`);
      router.invalidate();
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const list = tab === "mine" ? mine : incoming;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Package className="w-7 h-7 text-primary" /> Orders
          </h1>
          <Link to="/agrovet" className="text-sm text-primary hover:underline">
            ← Back to catalog
          </Link>
        </div>

        {isAgrovet && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("mine")}
              className={`px-4 py-2 rounded-full text-sm border ${
                tab === "mine" ? "bg-primary text-primary-foreground border-primary" : "border-border"
              }`}
            >
              My orders ({mine.length})
            </button>
            <button
              onClick={() => setTab("incoming")}
              className={`px-4 py-2 rounded-full text-sm border ${
                tab === "incoming" ? "bg-primary text-primary-foreground border-primary" : "border-border"
              }`}
            >
              <Inbox className="inline w-4 h-4 mr-1" /> Incoming ({incoming.length})
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {tab === "mine" ? (
                <>
                  No orders yet.{" "}
                  <Link to="/agrovet" className="text-primary hover:underline">
                    Browse the catalog
                  </Link>
                </>
              ) : (
                "No incoming orders yet."
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {list.map((o) => (
              <Card key={o.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      Order #{o.id.slice(0, 8)}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge className={statusColor[o.status]}>{o.status}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="divide-y divide-border border-y border-border">
                    {o.order_items.map((i) => (
                      <div key={i.id} className="py-2 flex justify-between text-sm">
                        <span>
                          {i.name} × {i.quantity}
                        </span>
                        <span className="font-medium">
                          KES {Number(i.subtotal_kes).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {o.contact_phone && <>📞 {o.contact_phone}</>}
                      {o.delivery_notes && <div className="mt-1">📝 {o.delivery_notes}</div>}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      KES {Number(o.total_kes).toLocaleString()}
                    </div>
                  </div>

                  {tab === "incoming" && o.status === "pending" && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => changeStatus(o.id, "confirmed")}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => changeStatus(o.id, "cancelled")}>
                        Decline
                      </Button>
                    </div>
                  )}
                  {tab === "incoming" && o.status === "confirmed" && (
                    <Button size="sm" onClick={() => changeStatus(o.id, "fulfilled")}>
                      Mark fulfilled
                    </Button>
                  )}
                  {tab === "mine" && o.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => changeStatus(o.id, "cancelled")}>
                      Cancel order
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

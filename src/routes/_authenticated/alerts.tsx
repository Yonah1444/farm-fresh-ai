import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Bell, CloudRain, TrendingUp, RefreshCw, Trash2 } from "lucide-react";
import { runAlertCheck, upsertPricePref } from "@/lib/alerts.functions";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alerts — AgriConnect AI" }] }),
  component: AlertsPage,
});

type Alert = {
  id: string;
  type: "weather" | "price";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

type Pref = {
  id: string;
  crop: string;
  target_price: number;
  direction: "above" | "below";
  currency: string;
  unit: string;
  active: boolean;
};

type MarketPrice = { crop: string; price: number; currency: string; unit: string; market: string | null };

function severityClass(s: Alert["severity"]) {
  if (s === "critical") return "border-l-4 border-destructive bg-destructive/5";
  if (s === "warning") return "border-l-4 border-yellow-500 bg-yellow-500/5";
  return "border-l-4 border-primary bg-primary/5";
}

function AlertsPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const check = useServerFn(runAlertCheck);
  const addPref = useServerFn(upsertPricePref);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prefs, setPrefs] = useState<Pref[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [running, setRunning] = useState(false);

  const load = async () => {
    const [a, p, mp] = await Promise.all([
      supabase.from("alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("price_alert_prefs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("market_prices").select("crop,price,currency,unit,market").order("observed_at", { ascending: false }).limit(20),
    ]);
    setAlerts((a.data ?? []) as Alert[]);
    setPrefs((p.data ?? []) as Pref[]);
    setPrices((mp.data ?? []) as MarketPrice[]);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCheck = async () => {
    setRunning(true);
    try {
      const res = await check();
      toast.success(res.created > 0 ? `${res.created} new alert${res.created === 1 ? "" : "s"}` : "No new alerts");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check failed");
    } finally {
      setRunning(false);
    }
  };

  const markRead = async (id: string) => {
    await supabase.from("alerts").update({ read_at: new Date().toISOString() }).eq("id", id);
    void load();
  };

  const dismiss = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    void load();
  };

  const addPriceAlert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await addPref({
        data: {
          crop: String(fd.get("crop") ?? ""),
          target_price: Number(fd.get("target_price") ?? 0),
          direction: (fd.get("direction") as "above" | "below") ?? "above",
          currency: String(fd.get("currency") ?? "KES"),
          unit: String(fd.get("unit") ?? "kg"),
        },
      });
      toast.success("Price alert saved");
      (e.target as HTMLFormElement).reset();
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const togglePref = async (p: Pref) => {
    await supabase.from("price_alert_prefs").update({ active: !p.active }).eq("id", p.id);
    void load();
  };

  const deletePref = async (id: string) => {
    await supabase.from("price_alert_prefs").delete().eq("id", id);
    void load();
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <Button onClick={runCheck} disabled={running} size="sm">
            <RefreshCw className={`w-4 h-4 ${running ? "animate-spin" : ""}`} />
            {running ? "Checking..." : "Check now"}
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="font-display text-4xl font-bold flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" /> Weather & Price Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Live forecasts for each farm location and price triggers for your crops.
          </p>
        </div>

        <section>
          <h2 className="font-display text-2xl font-bold mb-4">Inbox</h2>
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No alerts yet. Hit <strong>Check now</strong> to pull weather & price triggers.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <Card key={a.id} className={`${severityClass(a.severity)} ${a.read_at ? "opacity-60" : ""}`}>
                  <CardContent className="py-4 flex items-start gap-4">
                    {a.type === "weather" ? (
                      <CloudRain className="w-5 h-5 mt-1 shrink-0" />
                    ) : (
                      <TrendingUp className="w-5 h-5 mt-1 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold">{a.title}</h3>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm mt-1">{a.message}</p>
                      <div className="flex gap-2 mt-3">
                        {!a.read_at && (
                          <Button size="sm" variant="ghost" onClick={() => markRead(a.id)}>
                            Mark read
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => dismiss(a.id)}>
                          <Trash2 className="w-3 h-3" /> Dismiss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>New price alert</CardTitle>
              <CardDescription>Get notified when a crop crosses your target.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addPriceAlert} className="space-y-3">
                <div>
                  <Label htmlFor="crop">Crop</Label>
                  <Input id="crop" name="crop" required placeholder="tomatoes" maxLength={60} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="target_price">Target price</Label>
                    <Input id="target_price" name="target_price" type="number" step="0.01" min="0" required />
                  </div>
                  <div>
                    <Label htmlFor="direction">When</Label>
                    <select
                      id="direction"
                      name="direction"
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                      defaultValue="above"
                    >
                      <option value="above">≥</option>
                      <option value="below">≤</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue="KES" maxLength={8} />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" name="unit" defaultValue="kg" maxLength={16} />
                  </div>
                </div>
                <Button type="submit" className="w-full">Save alert</Button>
              </form>

              {prefs.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Your triggers</h4>
                  {prefs.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-sm border border-border rounded-md px-3 py-2">
                      <div>
                        <span className="font-medium capitalize">{p.crop}</span>{" "}
                        <span className="text-muted-foreground">
                          {p.direction === "above" ? "≥" : "≤"} {p.currency} {p.target_price}/{p.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => togglePref(p)}>
                          {p.active ? "Pause" : "Resume"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deletePref(p.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest market prices</CardTitle>
              <CardDescription>Reference quotes used for price triggers.</CardDescription>
            </CardHeader>
            <CardContent>
              {prices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No prices yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {prices.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="capitalize font-medium">{p.crop}</span>
                      <span className="text-muted-foreground">
                        {p.currency} {Number(p.price).toFixed(0)}/{p.unit}
                        {p.market ? ` · ${p.market}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

// Suppress unused warning for router import retained for future use
void useRouter;

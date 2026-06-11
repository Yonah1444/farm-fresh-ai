import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { LogOut, Plus, Trash2, Sprout, Beef } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Farmer Dashboard — AgriConnect AI" }] }),
  component: Dashboard,
});

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  region: string | null;
  language: string | null;
};

type Farm = {
  id: string;
  name: string;
  location: string | null;
  hectares: number | null;
  crops: string[];
  livestock: string[];
  notes: string | null;
};

const farmSchema = z.object({
  name: z.string().trim().min(1, "Farm name required").max(100),
  location: z.string().trim().max(200).optional(),
  hectares: z.number().nonnegative().max(100000).optional(),
  crops: z.string().max(500).optional(),
  livestock: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

function Dashboard() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFarmForm, setShowFarmForm] = useState(false);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("farms").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(p as Profile | null);
    setFarms((f ?? []) as Farm[]);
    setLoading(false);
  };

  const saveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: user.id,
      full_name: String(fd.get("full_name") ?? "").trim().slice(0, 100),
      phone: String(fd.get("phone") ?? "").trim().slice(0, 30),
      country: String(fd.get("country") ?? "").trim().slice(0, 60),
      region: String(fd.get("region") ?? "").trim().slice(0, 60),
      language: String(fd.get("language") ?? "en").slice(0, 10),
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
    void loadData();
  };

  const addFarm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      location: String(fd.get("location") ?? ""),
      hectares: fd.get("hectares") ? Number(fd.get("hectares")) : undefined,
      crops: String(fd.get("crops") ?? ""),
      livestock: String(fd.get("livestock") ?? ""),
      notes: String(fd.get("notes") ?? ""),
    };
    try {
      const v = farmSchema.parse(raw);
      const { error } = await supabase.from("farms").insert({
        user_id: user.id,
        name: v.name,
        location: v.location || null,
        hectares: v.hectares ?? null,
        crops: v.crops ? v.crops.split(",").map((s) => s.trim()).filter(Boolean) : [],
        livestock: v.livestock ? v.livestock.split(",").map((s) => s.trim()).filter(Boolean) : [],
        notes: v.notes || null,
      });
      if (error) throw error;
      toast.success("Farm added");
      setShowFarmForm(false);
      (e.target as HTMLFormElement).reset();
      void loadData();
    } catch (err) {
      if (err instanceof z.ZodError) toast.error(err.issues[0].message);
      else toast.error(err instanceof Error ? err.message : "Failed to add farm");
    }
  };

  const deleteFarm = async (id: string) => {
    if (!confirm("Delete this farm?")) return;
    const { error } = await supabase.from("farms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Farm deleted");
    void loadData();
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading your farm...</div>;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display italic text-2xl font-bold text-accent">
            AgriConnect AI
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/diagnose"
              className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90"
            >
              AI Diagnosis
            </Link>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.full_name ?? user.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">
            Karibu, {profile?.full_name?.split(" ")[0] ?? "farmer"}.
          </h1>
          <p className="text-muted-foreground mt-2">Manage your farm profile and registered plots.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Farmer profile</CardTitle>
            <CardDescription>Used to personalize advisory and connect you to buyers.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ""} maxLength={100} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={profile?.phone ?? ""} maxLength={30} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" defaultValue={profile?.country ?? ""} placeholder="Kenya" maxLength={60} />
              </div>
              <div>
                <Label htmlFor="region">Region / County</Label>
                <Input id="region" name="region" defaultValue={profile?.region ?? ""} placeholder="Kiambu" maxLength={60} />
              </div>
              <div>
                <Label htmlFor="language">Preferred language</Label>
                <Input id="language" name="language" defaultValue={profile?.language ?? "en"} placeholder="en / sw" maxLength={10} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save profile</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-bold">My farms</h2>
              <p className="text-sm text-muted-foreground">Vegetables, fruits, staples & livestock.</p>
            </div>
            <Button onClick={() => setShowFarmForm((s) => !s)}>
              <Plus className="w-4 h-4" /> {showFarmForm ? "Cancel" : "Add farm"}
            </Button>
          </div>

          {showFarmForm && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <form onSubmit={addFarm} className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Farm name *</Label>
                    <Input id="name" name="name" required maxLength={100} />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="Village, ward" maxLength={200} />
                  </div>
                  <div>
                    <Label htmlFor="hectares">Size (hectares)</Label>
                    <Input id="hectares" name="hectares" type="number" step="0.01" min="0" max="100000" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="crops">Crops (comma-separated)</Label>
                    <Input id="crops" name="crops" placeholder="tomatoes, mangoes, maize, kale" maxLength={500} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="livestock">Livestock (comma-separated)</Label>
                    <Input id="livestock" name="livestock" placeholder="dairy cows, goats, layers" maxLength={500} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" maxLength={1000} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit">Save farm</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {farms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No farms registered yet. Click <strong>Add farm</strong> to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {farms.map((farm) => (
                <Card key={farm.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle>{farm.name}</CardTitle>
                        <CardDescription>
                          {farm.location ?? "Unspecified location"}
                          {farm.hectares ? ` • ${farm.hectares} ha` : ""}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteFarm(farm.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {farm.crops.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-1">
                          <Sprout className="w-3 h-3" /> Crops
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {farm.crops.map((c) => (
                            <span key={c} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {farm.livestock.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider mb-1">
                          <Beef className="w-3 h-3" /> Livestock
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {farm.livestock.map((l) => (
                            <span key={l} className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {farm.notes && <p className="text-muted-foreground">{farm.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

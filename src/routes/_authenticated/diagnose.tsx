import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, Sprout, Beef, Trash2, ArrowLeft } from "lucide-react";
import {
  diagnoseSubject,
  listDiagnoses,
  deleteDiagnosis,
} from "@/lib/diagnose.functions";

export const Route = createFileRoute("/_authenticated/diagnose")({
  head: () => ({ meta: [{ title: "AI Diagnosis — AgriConnect AI" }] }),
  component: DiagnosePage,
});

type Farm = { id: string; name: string };
type Diagnosis = {
  id: string;
  farm_id: string;
  subject_type: "crop" | "livestock";
  subject_name: string | null;
  image_path: string | null;
  diagnosis: string;
  treatment: string | null;
  confidence: string | null;
  created_at: string;
  farms?: { name: string } | null;
};

function DiagnosePage() {
  const diagnoseFn = useServerFn(diagnoseSubject);
  const listFn = useServerFn(listDiagnoses);
  const deleteFn = useServerFn(deleteDiagnosis);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState<string>("");
  const [subjectType, setSubjectType] = useState<"crop" | "livestock">("crop");
  const [subjectName, setSubjectName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Diagnosis[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function loadFarms() {
    const { data } = await supabase.from("farms").select("id, name").order("created_at");
    setFarms(data ?? []);
    if (data && data.length > 0 && !farmId) setFarmId(data[0].id);
  }

  async function loadHistory() {
    try {
      const rows = (await listFn()) as Diagnosis[];
      setHistory(rows);
      // Sign image URLs
      const paths = rows.map((r) => r.image_path).filter(Boolean) as string[];
      if (paths.length) {
        const { data } = await supabase.storage.from("diagnoses").createSignedUrls(paths, 3600);
        const map: Record<string, string> = {};
        data?.forEach((d, i) => {
          if (d.signedUrl) map[paths[i]] = d.signedUrl;
        });
        setSignedUrls(map);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadFarms();
    loadHistory();
  }, []);

  useEffect(() => {
    if (!file) return setPreviewUrl(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmId) return toast.error("Add a farm first from the dashboard");
    if (!file) return toast.error("Choose a photo to analyze");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image too large (max 8MB)");

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${farmId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("diagnoses")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      await diagnoseFn({
        data: {
          farm_id: farmId,
          subject_type: subjectType,
          subject_name: subjectName || undefined,
          image_path: path,
          image_mime: file.type || "image/jpeg",
        },
      });

      toast.success("Diagnosis complete");
      setFile(null);
      setSubjectName("");
      if (fileRef.current) fileRef.current.value = "";
      await loadHistory();
    } catch (err: any) {
      toast.error(err?.message ?? "Diagnosis failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this diagnosis?")) return;
    try {
      await deleteFn({ data: { id } });
      setHistory((h) => h.filter((d) => d.id !== id));
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <span className="font-display italic text-xl font-bold text-accent">AgriConnect AI</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-5 gap-8">
        <section className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">AI Diagnosis</h1>
            <p className="text-muted mt-2">
              Upload a clear photo of a plant leaf, fruit, or animal. Our AI agronomist & vet will diagnose and prescribe.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New diagnosis</CardTitle>
              <CardDescription>Photos are private to your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Farm</Label>
                  <select
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                    value={farmId}
                    onChange={(e) => setFarmId(e.target.value)}
                  >
                    {farms.length === 0 && <option value="">No farms — add one in the dashboard</option>}
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Type</Label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSubjectType("crop")}
                      className={`flex items-center justify-center gap-2 h-10 rounded-md border text-sm font-medium transition-colors ${
                        subjectType === "crop"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent/10"
                      }`}
                    >
                      <Sprout className="h-4 w-4" /> Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubjectType("livestock")}
                      className={`flex items-center justify-center gap-2 h-10 rounded-md border text-sm font-medium transition-colors ${
                        subjectType === "livestock"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent/10"
                      }`}
                    >
                      <Beef className="h-4 w-4" /> Livestock
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sname">Subject (optional)</Label>
                  <Input
                    id="sname"
                    placeholder={subjectType === "crop" ? "e.g. Tomato leaf" : "e.g. Dairy cow"}
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor="photo">Photo</Label>
                  <input
                    ref={fileRef}
                    id="photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-2 file:text-sm file:font-medium"
                  />
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="mt-3 rounded-md border border-border max-h-64 object-cover"
                    />
                  )}
                </div>

                <Button type="submit" disabled={submitting || !file || !farmId} className="w-full">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Diagnose</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-3 space-y-4">
          <h2 className="font-display text-2xl font-bold">Recent diagnoses</h2>
          {history.length === 0 && (
            <p className="text-muted text-sm">No diagnoses yet. Upload your first photo to get started.</p>
          )}
          <div className="space-y-4">
            {history.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-5 flex gap-4">
                  {d.image_path && signedUrls[d.image_path] && (
                    <img
                      src={signedUrls[d.image_path]}
                      alt=""
                      className="w-28 h-28 rounded-md object-cover border border-border flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                        {d.subject_type === "crop" ? <Sprout className="h-3 w-3" /> : <Beef className="h-3 w-3" />}
                        <span>{d.subject_type}</span>
                        {d.farms?.name && <span>• {d.farms.name}</span>}
                        {d.confidence && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent normal-case tracking-normal">
                            {d.confidence} confidence
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="text-muted hover:text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {d.subject_name && (
                      <h3 className="font-semibold text-lg mt-1">{d.subject_name}</h3>
                    )}
                    <p className="text-sm mt-2 whitespace-pre-line">{d.diagnosis}</p>
                    {d.treatment && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-1">
                          Treatment
                        </p>
                        <p className="text-sm whitespace-pre-line">{d.treatment}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted mt-3">
                      {new Date(d.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

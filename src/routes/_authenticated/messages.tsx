import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listConversations } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Sprout } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — AgriConnect AI" }] }),
  component: Inbox,
});

type Row = Awaited<ReturnType<typeof listConversations>>[number];

function Inbox() {
  const listFn = useServerFn(listConversations);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = (await listFn()) as Row[];
    setRows(r);
    setLoading(false);
  }
  useEffect(() => {
    load();
    const channel = supabase
      .channel("inbox-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function imgUrl(path: string | null | undefined) {
    if (!path) return null;
    return supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <Link to="/marketplace" className="text-sm font-bold text-accent hover:underline">
            Marketplace →
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-4xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-accent" /> Messages
        </h1>
        <p className="text-muted mt-2">Conversations with buyers and farmers about listings.</p>

        <div className="mt-8 space-y-3">
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted">
                No conversations yet. Open a listing on the{" "}
                <Link to="/marketplace" className="text-accent underline">marketplace</Link>{" "}
                and message a farmer to start.
              </CardContent>
            </Card>
          ) : (
            rows.map((c) => {
              const img = imgUrl(c.listings?.image_path);
              return (
                <Link
                  key={c.id}
                  to="/messages/$id"
                  params={{ id: c.id }}
                  className="block"
                >
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-md bg-muted/10 overflow-hidden shrink-0 flex items-center justify-center">
                        {img ? (
                          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Sprout className="h-6 w-6 text-muted opacity-40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold truncate">{c.listings?.title ?? "Listing"}</p>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
                            {c.role === "buyer" ? "I'm buying" : "I'm selling"}
                          </span>
                        </div>
                        <p className="text-sm text-muted truncate">
                          with {c.other_user_name}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {new Date(c.last_message_at).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getConversation, sendChatMessage } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send, Sprout } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({ meta: [{ title: "Chat — AgriConnect AI" }] }),
  component: Thread,
});

type Loaded = Awaited<ReturnType<typeof getConversation>>;
type Message = Loaded["messages"][number];

function Thread() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getConversation);
  const sendFn = useServerFn(sendChatMessage);

  const [state, setState] = useState<Loaded | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = (await getFn({ data: { id } })) as Loaded;
        if (active) setState(r);
      } catch (e: any) {
        toast.error(e?.message ?? "Could not load conversation");
      }
    })();

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setState((prev) =>
            prev && !prev.messages.some((x) => x.id === m.id)
              ? { ...prev, messages: [...prev.messages, m] }
              : prev,
          );
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id, getFn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [state?.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const m = (await sendFn({
        data: { conversation_id: id, body: text },
      })) as Message;
      setState((prev) =>
        prev && !prev.messages.some((x) => x.id === m.id)
          ? { ...prev, messages: [...prev.messages, m] }
          : prev,
      );
      setBody("");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send");
    } finally {
      setSending(false);
    }
  }

  const listing = state?.conversation.listings;
  const img = listing?.image_path
    ? supabase.storage.from("listings").getPublicUrl(listing.image_path).data.publicUrl
    : null;

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/messages" className="flex items-center gap-2 text-sm text-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Inbox
          </Link>
          {state && (
            <span className="text-xs uppercase tracking-wider text-accent">
              {state.conversation.role === "buyer" ? "Buying" : "Selling"}
            </span>
          )}
        </div>
      </header>

      {state ? (
        <>
          <div className="border-b border-border">
            <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-md bg-muted/10 overflow-hidden shrink-0 flex items-center justify-center">
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Sprout className="h-5 w-5 text-muted opacity-40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{listing?.title ?? "Listing"}</p>
                <p className="text-sm text-muted">with {state.conversation.other_user_name}</p>
              </div>
              {listing?.price != null && (
                <p className="font-bold text-primary text-right shrink-0">
                  {listing.currency ?? "KES"} {Number(listing.price).toLocaleString()}
                  {listing.unit && <span className="text-xs text-muted font-normal"> / {listing.unit}</span>}
                </p>
              )}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-6 space-y-3">
              {state.messages.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-sm text-muted text-center">
                    Start the conversation. Ask about availability, pricing, or pickup.
                  </CardContent>
                </Card>
              ) : (
                state.messages.map((m) => {
                  const mine = m.sender_id === state.me;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          mine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted/15 text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <form onSubmit={handleSend} className="border-t border-border bg-background sticky bottom-0">
            <div className="max-w-3xl mx-auto px-6 py-3 flex items-end gap-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message…"
                rows={1}
                maxLength={4000}
                className="resize-none min-h-[40px] max-h-40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <Button type="submit" disabled={sending || !body.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </>
      ) : (
        <p className="max-w-3xl mx-auto px-6 py-10 text-muted">Loading conversation…</p>
      )}
    </main>
  );
}

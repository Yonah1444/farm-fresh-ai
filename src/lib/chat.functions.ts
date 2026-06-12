import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const startConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ listing_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: listing, error: lerr } = await supabase
      .from("listings")
      .select("id, user_id, status")
      .eq("id", data.listing_id)
      .maybeSingle();
    if (lerr || !listing) throw new Error("Listing not found");
    if (listing.status !== "active") throw new Error("Listing is not active");
    if (listing.user_id === userId) throw new Error("You cannot message your own listing");

    // Try to find existing conversation
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("buyer_id", userId)
      .maybeSingle();
    if (existing) return { id: existing.id };

    const { data: inserted, error } = await supabase
      .from("conversations")
      .insert({
        listing_id: listing.id,
        buyer_id: userId,
        seller_id: listing.user_id,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id };
  });

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        conversation_id: z.string().uuid(),
        body: z.string().trim().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        sender_id: userId,
        body: data.body,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("conversations")
      .select(
        "id, listing_id, buyer_id, seller_id, last_message_at, created_at, listings(title, image_path, currency, price, unit, status)",
      )
      .order("last_message_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const otherIds = Array.from(
      new Set(rows.map((r) => (r.buyer_id === userId ? r.seller_id : r.buyer_id))),
    );
    let nameMap = new Map<string, string>();
    if (otherIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", otherIds);
      nameMap = new Map((profs ?? []).map((p) => [p.id, p.full_name ?? "User"]));
    }

    return rows.map((r) => {
      const otherId = r.buyer_id === userId ? r.seller_id : r.buyer_id;
      return {
        ...r,
        other_user_id: otherId,
        other_user_name: nameMap.get(otherId) ?? "User",
        role: r.buyer_id === userId ? ("buyer" as const) : ("seller" as const),
      };
    });
  });

export const getConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: conv, error } = await supabase
      .from("conversations")
      .select(
        "id, listing_id, buyer_id, seller_id, last_message_at, listings(title, image_path, currency, price, unit, status)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conv) throw new Error("Conversation not found");

    const otherId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", otherId)
      .maybeSingle();

    const { data: messages } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true })
      .limit(500);

    return {
      conversation: {
        ...conv,
        other_user_id: otherId,
        other_user_name: prof?.full_name ?? "User",
        role: conv.buyer_id === userId ? ("buyer" as const) : ("seller" as const),
      },
      messages: messages ?? [],
      me: userId,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive().max(100000),
  message: z.string().trim().max(1000).optional(),
  contact_phone: z.string().trim().max(30).optional(),
});

export const createQuoteRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: product, error: pErr } = await supabase
      .from("agrovet_products")
      .select("id, agrovet_id, active")
      .eq("id", data.product_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product || !product.active) throw new Error("Product not available");
    if (product.agrovet_id === userId) throw new Error("You cannot quote your own product");

    const { data: row, error } = await supabase
      .from("quote_requests")
      .insert({
        product_id: data.product_id,
        buyer_id: userId,
        agrovet_id: product.agrovet_id,
        quantity: data.quantity,
        message: data.message ?? null,
        contact_phone: data.contact_phone ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listMyQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("quote_requests")
      .select("*, agrovet_products(name, unit, image_path)")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const listIncomingQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("quote_requests")
      .select("*, agrovet_products(name, unit, image_path)")
      .eq("agrovet_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

const respondSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["quoted", "declined", "closed"]),
  quoted_price_kes: z.number().nonnegative().max(1e9).optional(),
  quoted_note: z.string().trim().max(1000).optional(),
});

export const respondToQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => respondSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("quote_requests")
      .update({
        status: data.status,
        quoted_price_kes: data.quoted_price_kes ?? null,
        quoted_note: data.quoted_note ?? null,
      })
      .eq("id", data.id)
      .eq("agrovet_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

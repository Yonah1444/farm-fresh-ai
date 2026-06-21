import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PlaceOrderSchema = z.object({
  contact_phone: z.string().trim().min(7).max(30),
  delivery_notes: z.string().trim().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().positive().max(10_000),
      }),
    )
    .min(1)
    .max(100),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlaceOrderSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const ids = [...new Set(data.items.map((i) => i.product_id))];
    const { data: products, error: pErr } = await supabase
      .from("agrovet_products")
      .select("id, agrovet_id, name, price_kes, stock, active")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products || products.length !== ids.length) {
      throw new Error("Some products are no longer available");
    }

    // Group by agrovet
    const byAgrovet = new Map<
      string,
      Array<{ product_id: string; name: string; unit_price_kes: number; quantity: number; subtotal_kes: number }>
    >();

    for (const item of data.items) {
      const p = products.find((pp) => pp.id === item.product_id)!;
      if (!p.active) throw new Error(`"${p.name}" is no longer available`);
      if (p.stock < item.quantity) throw new Error(`"${p.name}" only has ${p.stock} in stock`);
      const entry = byAgrovet.get(p.agrovet_id) ?? [];
      const unit = Number(p.price_kes);
      entry.push({
        product_id: p.id,
        name: p.name,
        unit_price_kes: unit,
        quantity: item.quantity,
        subtotal_kes: Number((unit * item.quantity).toFixed(2)),
      });
      byAgrovet.set(p.agrovet_id, entry);
    }

    const created: Array<{ id: string; agrovet_id: string; total_kes: number }> = [];

    for (const [agrovet_id, items] of byAgrovet) {
      const total = Number(items.reduce((s, i) => s + i.subtotal_kes, 0).toFixed(2));
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          buyer_id: userId,
          agrovet_id,
          total_kes: total,
          contact_phone: data.contact_phone,
          delivery_notes: data.delivery_notes ?? null,
        })
        .select("id, agrovet_id, total_kes")
        .single();
      if (oErr || !order) throw new Error(oErr?.message ?? "Could not create order");

      const { error: iErr } = await supabase
        .from("order_items")
        .insert(items.map((i) => ({ ...i, order_id: order.id })));
      if (iErr) {
        await supabase.from("orders").delete().eq("id", order.id);
        throw new Error(iErr.message);
      }

      // Decrement stock
      for (const i of items) {
        const p = products.find((pp) => pp.id === i.product_id)!;
        await supabase
          .from("agrovet_products")
          .update({ stock: p.stock - i.quantity })
          .eq("id", p.id);
      }

      created.push({ id: order.id, agrovet_id: order.agrovet_id, total_kes: Number(order.total_kes) });
    }

    return { orders: created };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, agrovet_id, status, total_kes, contact_phone, delivery_notes, created_at, order_items(id, name, quantity, unit_price_kes, subtotal_kes)")
      .eq("buyer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listIncomingOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, buyer_id, status, total_kes, contact_phone, delivery_notes, created_at, order_items(id, name, quantity, unit_price_kes, subtotal_kes)")
      .eq("agrovet_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "cancelled", "fulfilled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ACTIVITY_TYPES = [
  "planting",
  "harvest",
  "treatment",
  "fertilizer",
  "irrigation",
  "pest_control",
  "vaccination",
  "sale",
  "other",
] as const;

const createSchema = z.object({
  farm_id: z.string().uuid(),
  type: z.enum(ACTIVITY_TYPES),
  title: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).optional(),
  quantity: z.number().nonnegative().max(1e9).optional(),
  unit: z.string().trim().max(40).optional(),
  cost_kes: z.number().nonnegative().max(1e9).optional(),
  occurred_at: z.string().datetime().optional(),
});

export const createFarmActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: farm, error: fErr } = await supabase
      .from("farms")
      .select("id")
      .eq("id", data.farm_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!farm) throw new Error("Farm not found");

    const { data: row, error } = await supabase
      .from("farm_activities")
      .insert({
        farm_id: data.farm_id,
        user_id: userId,
        type: data.type,
        title: data.title,
        notes: data.notes ?? null,
        quantity: data.quantity ?? null,
        unit: data.unit ?? null,
        cost_kes: data.cost_kes ?? null,
        occurred_at: data.occurred_at ?? new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listFarmActivities = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ farm_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("farm_activities")
      .select("*")
      .eq("farm_id", data.farm_id)
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows;
  });

export const deleteFarmActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("farm_activities")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

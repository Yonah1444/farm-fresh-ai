import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_BYTES = 256;

const Category = z.enum(["seed", "fertilizer", "pesticide", "feed", "equipment", "other"]);

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(140),
  category: Category,
  description: z.string().trim().max(2000).optional().nullable(),
  price_kes: z.number().nonnegative().max(10_000_000),
  unit: z.string().trim().min(1).max(20).default("unit"),
  stock: z.number().int().nonnegative().max(1_000_000).default(0),
  active: z.boolean().default(true),
  image_path: z
    .string()
    .max(500)
    .regex(/^[a-zA-Z0-9/_.\-]+$/, "Invalid image path")
    .optional()
    .nullable(),
});

function sniffMime(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) return "image/png";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

export const upsertAgrovetProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAgrovet } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "agrovet",
    });
    if (!isAgrovet) throw new Error("Only agrovet accounts can manage products");

    if (data.image_path) {
      if (!data.image_path.startsWith(`${userId}/`)) throw new Error("Invalid image path");
      const { data: blob, error } = await supabase.storage
        .from("agrovet-products")
        .download(data.image_path);
      if (error || !blob) throw new Error("Could not read uploaded image");
      if (blob.size > MAX_BYTES) {
        await supabase.storage.from("agrovet-products").remove([data.image_path]);
        throw new Error(`Image too large (max ${MAX_BYTES / 1024 / 1024}MB)`);
      }
      if (blob.size < MIN_BYTES) {
        await supabase.storage.from("agrovet-products").remove([data.image_path]);
        throw new Error("Image is empty or corrupted");
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (!sniffMime(bytes)) {
        await supabase.storage.from("agrovet-products").remove([data.image_path]);
        throw new Error("Unsupported image format. Use JPEG, PNG, or WEBP.");
      }
    }

    const row = {
      agrovet_id: userId,
      name: data.name,
      category: data.category,
      description: data.description ?? null,
      price_kes: data.price_kes,
      unit: data.unit,
      stock: data.stock,
      active: data.active,
      image_path: data.image_path ?? null,
    };

    if (data.id) {
      const { data: existing } = await supabase
        .from("agrovet_products")
        .select("agrovet_id, image_path")
        .eq("id", data.id)
        .maybeSingle();
      if (!existing || existing.agrovet_id !== userId) throw new Error("Product not found");
      if (existing.image_path && existing.image_path !== row.image_path) {
        await supabase.storage.from("agrovet-products").remove([existing.image_path]);
      }
      const { data: updated, error } = await supabase
        .from("agrovet_products")
        .update(row)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return updated;
    }
    const { data: inserted, error } = await supabase
      .from("agrovet_products")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const deleteAgrovetProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("agrovet_products")
      .select("agrovet_id, image_path")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || row.agrovet_id !== userId) throw new Error("Product not found");
    if (row.image_path) {
      await supabase.storage.from("agrovet-products").remove([row.image_path]);
    }
    const { error } = await supabase.from("agrovet_products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyAgrovetProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("agrovet_products")
      .select("*")
      .eq("agrovet_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setMyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ role: z.enum(["buyer", "agrovet"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("user_roles")
      .insert({ user_id: context.userId, role: data.role });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.role);
  });

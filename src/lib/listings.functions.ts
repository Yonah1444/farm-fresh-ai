import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;
const MIN_BYTES = 512;

const Category = z.enum(["vegetable", "fruit", "staple", "livestock", "dairy", "other"]);
const Status = z.enum(["active", "sold", "draft"]);

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  farm_id: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  category: Category,
  quantity: z.number().nonnegative().max(1_000_000).optional().nullable(),
  unit: z.string().trim().max(20).optional().nullable(),
  price: z.number().nonnegative().max(10_000_000).optional().nullable(),
  currency: z.string().trim().min(2).max(8).default("KES"),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  status: Status.default("active"),
  image_path: z
    .string()
    .max(500)
    .regex(/^[a-zA-Z0-9/_.\-]+$/, "Invalid image path")
    .optional()
    .nullable(),
  image_mime: z.enum(ALLOWED_MIMES).optional().nullable(),
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

export const upsertListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify farm ownership
    const { data: farm } = await supabase
      .from("farms")
      .select("id, user_id")
      .eq("id", data.farm_id)
      .maybeSingle();
    if (!farm || farm.user_id !== userId) throw new Error("Farm not found");

    // Validate image if present
    if (data.image_path) {
      if (!data.image_path.startsWith(`${userId}/`)) {
        throw new Error("Invalid image path");
      }
      const { data: blob, error } = await supabase.storage
        .from("listings")
        .download(data.image_path);
      if (error || !blob) throw new Error("Could not read uploaded image");
      if (blob.size > MAX_BYTES) {
        await supabase.storage.from("listings").remove([data.image_path]);
        throw new Error(`Image too large (max ${MAX_BYTES / 1024 / 1024}MB)`);
      }
      if (blob.size < MIN_BYTES) {
        await supabase.storage.from("listings").remove([data.image_path]);
        throw new Error("Image is empty or corrupted");
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const sniffed = sniffMime(bytes);
      if (!sniffed) {
        await supabase.storage.from("listings").remove([data.image_path]);
        throw new Error("Unsupported image format. Use JPEG, PNG, or WEBP.");
      }
    }

    const row = {
      user_id: userId,
      farm_id: data.farm_id,
      title: data.title,
      category: data.category,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      price: data.price ?? null,
      currency: data.currency,
      description: data.description ?? null,
      location: data.location ?? null,
      status: data.status,
      image_path: data.image_path ?? null,
    };

    if (data.id) {
      const { data: existing } = await supabase
        .from("listings")
        .select("user_id, image_path")
        .eq("id", data.id)
        .maybeSingle();
      if (!existing || existing.user_id !== userId) throw new Error("Listing not found");
      // Remove orphaned old image if replaced
      if (existing.image_path && existing.image_path !== row.image_path) {
        await supabase.storage.from("listings").remove([existing.image_path]);
      }
      const { data: updated, error } = await supabase
        .from("listings")
        .update(row)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return updated;
    }
    const { data: inserted, error } = await supabase
      .from("listings")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const deleteListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("listings")
      .select("user_id, image_path")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || row.user_id !== userId) throw new Error("Listing not found");
    if (row.image_path) {
      await supabase.storage.from("listings").remove([row.image_path]);
    }
    const { error } = await supabase.from("listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("listings")
      .select("*, farms(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

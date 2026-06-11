import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  farm_id: z.string().uuid(),
  subject_type: z.enum(["crop", "livestock"]),
  subject_name: z.string().trim().max(100).optional(),
  image_path: z.string().min(1).max(500),
  image_mime: z.string().min(1).max(50),
});

type DiagnosisJson = {
  diagnosis: string;
  treatment: string;
  confidence: "low" | "medium" | "high";
  subject_name?: string;
};

export const diagnoseSubject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify farm ownership
    const { data: farm, error: farmErr } = await supabase
      .from("farms")
      .select("id, user_id, name")
      .eq("id", data.farm_id)
      .maybeSingle();
    if (farmErr || !farm || farm.user_id !== userId) {
      throw new Error("Farm not found");
    }

    // Verify image belongs to user (path must start with userId/)
    if (!data.image_path.startsWith(`${userId}/`)) {
      throw new Error("Invalid image path");
    }

    // Download image bytes (RLS allows because middleware client acts as user)
    const { data: blob, error: dlErr } = await supabase.storage
      .from("diagnoses")
      .download(data.image_path);
    if (dlErr || !blob) throw new Error("Could not read uploaded image");

    const arrayBuf = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    const dataUrl = `data:${data.image_mime};base64,${base64}`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const system =
      data.subject_type === "crop"
        ? "You are an expert agronomist. The user shows a photo of a crop or plant leaf. Identify any disease, pest, deficiency, or condition. If healthy, say so. Respond in strict JSON only."
        : "You are an expert veterinarian. The user shows a photo of livestock (cattle, goat, sheep, poultry, pig). Identify any visible disease, parasite, injury, or condition. If healthy, say so. Respond in strict JSON only.";

    const userPrompt = `Analyze this ${data.subject_type} image${
      data.subject_name ? ` (subject: ${data.subject_name})` : ""
    }. Return JSON with exactly these keys:
{
  "subject_name": short name of crop/animal identified (string),
  "diagnosis": clear diagnosis with key symptoms observed (2-4 sentences),
  "treatment": practical treatment + prevention steps a smallholder farmer in Africa can follow (bullet-style, 3-6 items joined with newlines),
  "confidence": "low" | "medium" | "high"
}
No prose outside the JSON object.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      if (aiResp.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
      if (aiResp.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace billing.");
      throw new Error(`AI request failed: ${aiResp.status} ${text.slice(0, 200)}`);
    }

    const aiJson = await aiResp.json();
    const content: string = aiJson?.choices?.[0]?.message?.content ?? "";
    let parsed: DiagnosisJson;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned an unparseable response. Please try again.");
    }

    const { data: inserted, error: insErr } = await supabase
      .from("diagnoses")
      .insert({
        user_id: userId,
        farm_id: data.farm_id,
        subject_type: data.subject_type,
        subject_name: parsed.subject_name ?? data.subject_name ?? null,
        image_path: data.image_path,
        diagnosis: parsed.diagnosis,
        treatment: parsed.treatment ?? null,
        confidence: parsed.confidence ?? null,
        raw_response: aiJson,
      })
      .select("*")
      .single();
    if (insErr) throw new Error(insErr.message);

    return inserted;
  });

export const listDiagnoses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("diagnoses")
      .select("*, farms(name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteDiagnosis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row } = await supabase.from("diagnoses").select("image_path").eq("id", data.id).maybeSingle();
    if (row?.image_path) {
      await supabase.storage.from("diagnoses").remove([row.image_path]);
    }
    const { error } = await supabase.from("diagnoses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

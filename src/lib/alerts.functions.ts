import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type WeatherPoint = {
  time: string;
  temp_max: number;
  temp_min: number;
  precip: number;
  wind_max: number;
};

async function geocode(query: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = (await r.json()) as { results?: Array<{ latitude: number; longitude: number; name: string }> };
  const hit = j.results?.[0];
  return hit ? { lat: hit.latitude, lon: hit.longitude, name: hit.name } : null;
}

async function fetchForecast(lat: number, lon: number): Promise<WeatherPoint[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&forecast_days=3&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Weather service unavailable");
  const j = (await r.json()) as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      wind_speed_10m_max: number[];
    };
  };
  return j.daily.time.map((t, i) => ({
    time: t,
    temp_max: j.daily.temperature_2m_max[i],
    temp_min: j.daily.temperature_2m_min[i],
    precip: j.daily.precipitation_sum[i],
    wind_max: j.daily.wind_speed_10m_max[i],
  }));
}

type AlertInsert = {
  user_id: string;
  farm_id: string | null;
  type: "weather" | "price";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  payload: any;
};

function weatherAlertsFor(farmName: string, location: string, days: WeatherPoint[]): Array<Omit<AlertInsert, "user_id" | "farm_id">> {
  const out: Array<Omit<AlertInsert, "user_id" | "farm_id">> = [];
  for (const d of days) {
    if (d.precip >= 30) {
      out.push({
        type: "weather",
        severity: d.precip >= 60 ? "critical" : "warning",
        title: `Heavy rain expected at ${farmName}`,
        message: `${d.precip.toFixed(0)} mm of rain forecast for ${d.time} near ${location}. Protect seedlings & harvested produce.`,
        payload: { day: d },
      });
    }
    if (d.temp_max >= 35) {
      out.push({
        type: "weather",
        severity: d.temp_max >= 38 ? "critical" : "warning",
        title: `Heat stress risk at ${farmName}`,
        message: `Highs of ${d.temp_max.toFixed(0)}°C on ${d.time}. Irrigate early morning and shade livestock.`,
        payload: { day: d },
      });
    }
    if (d.temp_min <= 4) {
      out.push({
        type: "weather",
        severity: d.temp_min <= 0 ? "critical" : "warning",
        title: `Frost risk at ${farmName}`,
        message: `Lows of ${d.temp_min.toFixed(0)}°C on ${d.time}. Cover sensitive crops overnight.`,
        payload: { day: d },
      });
    }
    if (d.wind_max >= 50) {
      out.push({
        type: "weather",
        severity: "warning",
        title: `Strong winds at ${farmName}`,
        message: `Wind gusts up to ${d.wind_max.toFixed(0)} km/h on ${d.time}. Secure shade nets & greenhouses.`,
        payload: { day: d },
      });
    }
  }
  return out;
}

export const runAlertCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const inserts: AlertInsert[] = [];

    // Weather: per farm with a location
    const { data: farms } = await supabase
      .from("farms")
      .select("id,name,location")
      .eq("user_id", userId);

    for (const f of farms ?? []) {
      if (!f.location) continue;
      try {
        const g = await geocode(f.location);
        if (!g) continue;
        const forecast = await fetchForecast(g.lat, g.lon);
        for (const a of weatherAlertsFor(f.name, g.name, forecast)) {
          inserts.push({ ...a, user_id: userId, farm_id: f.id });
        }
      } catch {
        // skip farm on weather failure
      }
    }

    // Price: compare each active pref to latest market price for that crop
    const { data: prefs } = await supabase
      .from("price_alert_prefs")
      .select("id,crop,target_price,direction,currency,unit")
      .eq("user_id", userId)
      .eq("active", true);

    for (const p of prefs ?? []) {
      const { data: latest } = await supabase
        .from("market_prices")
        .select("price,currency,unit,market,observed_at")
        .ilike("crop", p.crop)
        .order("observed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latest) continue;
      const price = Number(latest.price);
      const target = Number(p.target_price);
      const triggered = p.direction === "above" ? price >= target : price <= target;
      if (!triggered) continue;
      inserts.push({
        user_id: userId,
        farm_id: null,
        type: "price",
        severity: "info",
        title: `${p.crop} price ${p.direction} target`,
        message: `Latest ${p.crop} at ${latest.market ?? "market"}: ${latest.currency} ${price}/${latest.unit} (target ${p.currency} ${target}/${p.unit}).`,
        payload: { latest, pref: p },
      });
    }

    if (inserts.length > 0) {
      await supabase.from("alerts").insert(inserts);
    }
    return { created: inserts.length };
  });

const prefSchema = z.object({
  crop: z.string().trim().min(1).max(60),
  target_price: z.number().positive().max(1_000_000),
  direction: z.enum(["above", "below"]),
  currency: z.string().trim().min(1).max(8).default("KES"),
  unit: z.string().trim().min(1).max(16).default("kg"),
});

export const upsertPricePref = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => prefSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("price_alert_prefs").insert({
      user_id: context.userId,
      crop: data.crop.toLowerCase(),
      target_price: data.target_price,
      direction: data.direction,
      currency: data.currency,
      unit: data.unit,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

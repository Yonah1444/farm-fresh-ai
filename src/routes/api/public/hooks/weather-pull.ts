import { createFileRoute } from "@tanstack/react-router";

type Farm = { id: string; user_id: string; name: string; location: string | null };

async function geocode(query: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = (await r.json()) as { results?: Array<{ latitude: number; longitude: number; name: string }> };
  const hit = j.results?.[0];
  return hit ? { lat: hit.latitude, lon: hit.longitude, name: hit.name } : null;
}

async function fetchForecast(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&forecast_days=2&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = (await r.json()) as {
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      wind_speed_10m_max: number[];
    };
  };
  return j.daily;
}

export const Route = createFileRoute("/api/public/hooks/weather-pull")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: farms, error } = await supabaseAdmin
          .from("farms")
          .select("id, user_id, name, location")
          .not("location", "is", null);
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let inserted = 0;
        for (const farm of (farms ?? []) as Farm[]) {
          if (!farm.location) continue;
          try {
            const geo = await geocode(farm.location);
            if (!geo) continue;
            const daily = await fetchForecast(geo.lat, geo.lon);
            if (!daily) continue;

            const today = {
              time: daily.time[0],
              temp_max: daily.temperature_2m_max[0],
              temp_min: daily.temperature_2m_min[0],
              precip: daily.precipitation_sum[0],
              wind: daily.wind_speed_10m_max[0],
            };
            const severity =
              today.precip >= 25 || today.wind >= 60 ? "critical" :
              today.precip >= 10 || today.wind >= 35 || today.temp_max >= 35 ? "warning" : "info";

            const summary = `${farm.name} (${geo.name}): ${today.temp_min}–${today.temp_max}°C, rain ${today.precip}mm, wind ${today.wind}km/h.`;

            await supabaseAdmin.from("alerts").insert({
              user_id: farm.user_id,
              farm_id: farm.id,
              type: "weather",
              severity,
              title: `Daily weather — ${farm.name}`,
              message: summary,
              payload: { location: geo.name, lat: geo.lat, lon: geo.lon, daily: today },
            });
            inserted++;
          } catch {
            // continue
          }
        }

        return new Response(JSON.stringify({ ok: true, inserted }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});

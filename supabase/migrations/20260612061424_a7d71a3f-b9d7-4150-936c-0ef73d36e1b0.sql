
CREATE TYPE public.alert_type AS ENUM ('weather','price');
CREATE TYPE public.alert_severity AS ENUM ('info','warning','critical');
CREATE TYPE public.price_direction AS ENUM ('above','below');

-- alerts
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms ON DELETE CASCADE,
  type public.alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX alerts_user_created_idx ON public.alerts(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own alerts" ON public.alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- price alert preferences
CREATE TABLE public.price_alert_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  crop TEXT NOT NULL,
  target_price NUMERIC(12,2) NOT NULL CHECK (target_price >= 0),
  direction public.price_direction NOT NULL DEFAULT 'above',
  currency TEXT NOT NULL DEFAULT 'KES',
  unit TEXT NOT NULL DEFAULT 'kg',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX price_prefs_user_idx ON public.price_alert_prefs(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alert_prefs TO authenticated;
GRANT ALL ON public.price_alert_prefs TO service_role;
ALTER TABLE public.price_alert_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.price_alert_prefs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER price_prefs_touch BEFORE UPDATE ON public.price_alert_prefs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- market prices (public reference data)
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  unit TEXT NOT NULL DEFAULT 'kg',
  market TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX market_prices_crop_idx ON public.market_prices(crop, observed_at DESC);
GRANT SELECT ON public.market_prices TO anon, authenticated;
GRANT ALL ON public.market_prices TO service_role;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read prices" ON public.market_prices FOR SELECT TO anon, authenticated USING (true);

-- seed reference prices
INSERT INTO public.market_prices (crop, price, currency, unit, market) VALUES
  ('tomatoes', 80, 'KES', 'kg', 'Wakulima'),
  ('maize', 55, 'KES', 'kg', 'Nakuru'),
  ('kale', 40, 'KES', 'kg', 'Wakulima'),
  ('mangoes', 120, 'KES', 'kg', 'Mombasa'),
  ('potatoes', 70, 'KES', 'kg', 'Nyandarua'),
  ('onions', 95, 'KES', 'kg', 'Wakulima'),
  ('beans', 180, 'KES', 'kg', 'Eldoret'),
  ('rice', 165, 'KES', 'kg', 'Mwea');

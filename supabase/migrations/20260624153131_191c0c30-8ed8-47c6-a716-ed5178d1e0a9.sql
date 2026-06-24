-- Quote requests for agrovet products
CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.agrovet_products(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agrovet_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  message text,
  contact_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','quoted','accepted','declined','closed')),
  quoted_price_kes numeric(12,2),
  quoted_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer or agrovet can view" ON public.quote_requests FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = agrovet_id);
CREATE POLICY "Buyer creates own request" ON public.quote_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyer updates own pending" ON public.quote_requests FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Agrovet responds" ON public.quote_requests FOR UPDATE TO authenticated
  USING (auth.uid() = agrovet_id) WITH CHECK (auth.uid() = agrovet_id);
CREATE INDEX quote_requests_buyer_idx ON public.quote_requests(buyer_id, created_at DESC);
CREATE INDEX quote_requests_agrovet_idx ON public.quote_requests(agrovet_id, created_at DESC);
CREATE TRIGGER quote_requests_touch BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Farm activity log
CREATE TYPE farm_activity_type AS ENUM ('planting','harvest','treatment','fertilizer','irrigation','pest_control','vaccination','sale','other');

CREATE TABLE public.farm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type farm_activity_type NOT NULL,
  title text NOT NULL,
  notes text,
  quantity numeric,
  unit text,
  cost_kes numeric(12,2),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_activities TO authenticated;
GRANT ALL ON public.farm_activities TO service_role;
ALTER TABLE public.farm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activities" ON public.farm_activities FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX farm_activities_farm_idx ON public.farm_activities(farm_id, occurred_at DESC);
CREATE INDEX farm_activities_user_idx ON public.farm_activities(user_id, occurred_at DESC);
CREATE TRIGGER farm_activities_touch BEFORE UPDATE ON public.farm_activities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TYPE public.listing_category AS ENUM ('vegetable','fruit','staple','livestock','dairy','other');
CREATE TYPE public.listing_status AS ENUM ('active','sold','draft');

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  title text NOT NULL,
  category public.listing_category NOT NULL DEFAULT 'other',
  quantity numeric,
  unit text,
  price numeric,
  currency text DEFAULT 'KES',
  description text,
  image_path text,
  location text,
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are public" ON public.listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users view own listings" ON public.listings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own listings" ON public.listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own listings" ON public.listings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own listings" ON public.listings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX listings_status_created_idx ON public.listings(status, created_at DESC);
CREATE INDEX listings_user_idx ON public.listings(user_id, created_at DESC);

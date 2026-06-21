
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agrovet', 'buyer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can self-assign buyer or agrovet role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role IN ('buyer','agrovet'));

CREATE POLICY "Users can remove their own non-admin roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND role <> 'admin');

-- Agrovet product catalog
CREATE TYPE public.agrovet_category AS ENUM ('seed','fertilizer','pesticide','feed','equipment','other');

CREATE TABLE public.agrovet_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrovet_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category public.agrovet_category NOT NULL,
  description text,
  price_kes numeric(12,2) NOT NULL CHECK (price_kes >= 0),
  unit text NOT NULL DEFAULT 'unit',
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_path text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agrovet_products_agrovet_idx ON public.agrovet_products(agrovet_id);
CREATE INDEX agrovet_products_category_idx ON public.agrovet_products(category);
CREATE INDEX agrovet_products_active_idx ON public.agrovet_products(active);

GRANT SELECT ON public.agrovet_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agrovet_products TO authenticated;
GRANT ALL ON public.agrovet_products TO service_role;

ALTER TABLE public.agrovet_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.agrovet_products
  FOR SELECT TO anon, authenticated
  USING (active = true OR auth.uid() = agrovet_id);

CREATE POLICY "Agrovets can insert their own products" ON public.agrovet_products
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = agrovet_id AND public.has_role(auth.uid(), 'agrovet'));

CREATE POLICY "Agrovets can update their own products" ON public.agrovet_products
  FOR UPDATE TO authenticated
  USING (auth.uid() = agrovet_id) WITH CHECK (auth.uid() = agrovet_id);

CREATE POLICY "Agrovets can delete their own products" ON public.agrovet_products
  FOR DELETE TO authenticated
  USING (auth.uid() = agrovet_id);

CREATE TRIGGER agrovet_products_touch
  BEFORE UPDATE ON public.agrovet_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage policies for an 'agrovet-products' bucket (bucket created via tool)
CREATE POLICY "Agrovet product images are publicly readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'agrovet-products');

CREATE POLICY "Agrovets can upload to their own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'agrovet-products'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.has_role(auth.uid(), 'agrovet')
  );

CREATE POLICY "Agrovets can update their own product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'agrovet-products' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Agrovets can delete their own product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'agrovet-products' AND (storage.foldername(name))[1] = auth.uid()::text);

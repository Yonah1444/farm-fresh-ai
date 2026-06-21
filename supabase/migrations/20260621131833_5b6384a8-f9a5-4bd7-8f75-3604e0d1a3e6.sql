
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','cancelled','fulfilled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agrovet_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_kes numeric(12,2) NOT NULL DEFAULT 0,
  contact_phone text,
  delivery_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "buyer can read own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "agrovet can read incoming orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = agrovet_id);
CREATE POLICY "buyer can insert own orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "agrovet can update incoming orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = agrovet_id) WITH CHECK (auth.uid() = agrovet_id);
CREATE POLICY "buyer can cancel own orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = buyer_id) WITH CHECK (auth.uid() = buyer_id);

CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.agrovet_products(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price_kes numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal_kes numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can read order items" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (o.buyer_id = auth.uid() OR o.agrovet_id = auth.uid())
    )
  );
CREATE POLICY "buyer can insert items into own order" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid()
    )
  );

CREATE INDEX orders_buyer_idx ON public.orders(buyer_id, created_at DESC);
CREATE INDEX orders_agrovet_idx ON public.orders(agrovet_id, created_at DESC);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);

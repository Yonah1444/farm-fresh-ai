
CREATE TABLE public.diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  subject_type text NOT NULL CHECK (subject_type IN ('crop','livestock')),
  subject_name text,
  image_path text,
  diagnosis text NOT NULL,
  treatment text,
  confidence text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnoses TO authenticated;
GRANT ALL ON public.diagnoses TO service_role;

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own diagnoses" ON public.diagnoses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER diagnoses_updated_at
  BEFORE UPDATE ON public.diagnoses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX diagnoses_farm_id_idx ON public.diagnoses(farm_id, created_at DESC);

CREATE POLICY "Users read own diagnosis images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'diagnoses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own diagnosis images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'diagnoses' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own diagnosis images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'diagnoses' AND auth.uid()::text = (storage.foldername(name))[1]);

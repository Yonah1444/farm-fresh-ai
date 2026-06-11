
CREATE POLICY "Listing photos are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

CREATE POLICY "Users upload own listing photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own listing photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Storage Buckets & Policies
-- Run AFTER 002_rls.sql
-- ============================================================

-- Artist Photos (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artist-photos',
  'artist-photos',
  TRUE,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Payment Receipts (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  FALSE,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ─── Artist Photos Policies ───────────────────────────────────
CREATE POLICY "artist_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artist-photos');

CREATE POLICY "artist_photos_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artist-photos' AND is_admin());

CREATE POLICY "artist_photos_admin_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'artist-photos' AND is_admin());

CREATE POLICY "artist_photos_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'artist-photos' AND is_admin());

-- ─── Payment Receipts Policies ────────────────────────────────
-- Client can upload to their own path: {user_id}/{booking_id}/...
CREATE POLICY "payment_receipts_client_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-receipts' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "payment_receipts_client_read_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-receipts' AND
    (is_admin() OR (storage.foldername(name))[1] = auth.uid()::TEXT)
  );

CREATE POLICY "payment_receipts_admin_all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'payment-receipts' AND is_admin());

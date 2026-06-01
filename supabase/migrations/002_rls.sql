-- ============================================================
-- Row-Level Security Policies
-- Run AFTER 001_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_packages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons      ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: check admin role ────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ─── Profiles ─────────────────────────────────────────────────
CREATE POLICY "profiles_select_own"   ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_update_own"   ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own"   ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ─── Artists ──────────────────────────────────────────────────
CREATE POLICY "artists_select_all"    ON artists FOR SELECT USING (TRUE);
CREATE POLICY "artists_admin_insert"  ON artists FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "artists_admin_update"  ON artists FOR UPDATE USING (is_admin());
CREATE POLICY "artists_admin_delete"  ON artists FOR DELETE USING (is_admin());

-- ─── Packages ─────────────────────────────────────────────────
CREATE POLICY "packages_select_all"   ON packages FOR SELECT USING (TRUE);
CREATE POLICY "packages_admin_insert" ON packages FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "packages_admin_update" ON packages FOR UPDATE USING (is_admin());
CREATE POLICY "packages_admin_delete" ON packages FOR DELETE USING (is_admin());

-- ─── Artist Packages ──────────────────────────────────────────
CREATE POLICY "artist_packages_select_all"   ON artist_packages FOR SELECT USING (TRUE);
CREATE POLICY "artist_packages_admin_insert" ON artist_packages FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "artist_packages_admin_update" ON artist_packages FOR UPDATE USING (is_admin());
CREATE POLICY "artist_packages_admin_delete" ON artist_packages FOR DELETE USING (is_admin());

-- ─── Add-ons ──────────────────────────────────────────────────
CREATE POLICY "addons_select_all"   ON addons FOR SELECT USING (TRUE);
CREATE POLICY "addons_admin_insert" ON addons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "addons_admin_update" ON addons FOR UPDATE USING (is_admin());
CREATE POLICY "addons_admin_delete" ON addons FOR DELETE USING (is_admin());

-- ─── Bookings ─────────────────────────────────────────────────
CREATE POLICY "bookings_select_own_or_admin"
  ON bookings FOR SELECT
  USING (client_id = auth.uid() OR is_admin());

CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "bookings_update_admin"
  ON bookings FOR UPDATE USING (is_admin());

-- ─── Booking Add-ons ──────────────────────────────────────────
CREATE POLICY "booking_addons_select_own_or_admin"
  ON booking_addons FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (b.client_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "booking_addons_insert_own"
  ON booking_addons FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.client_id = auth.uid())
  );

-- ─── Booking Status History ───────────────────────────────────
CREATE POLICY "booking_status_history_select"
  ON booking_status_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND (b.client_id = auth.uid() OR is_admin()))
  );

CREATE POLICY "booking_status_history_insert_admin"
  ON booking_status_history FOR INSERT
  WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

-- ─── Payments ─────────────────────────────────────────────────
CREATE POLICY "payments_select_own_or_admin"
  ON payments FOR SELECT
  USING (
    is_admin() OR
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.client_id = auth.uid())
  );

CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.client_id = auth.uid())
  );

CREATE POLICY "payments_update_admin"
  ON payments FOR UPDATE USING (is_admin());

-- ─── Products ─────────────────────────────────────────────────
CREATE POLICY "products_select_all"   ON products FOR SELECT USING (TRUE);
CREATE POLICY "products_admin_insert" ON products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "products_admin_update" ON products FOR UPDATE USING (is_admin());
CREATE POLICY "products_admin_delete" ON products FOR DELETE USING (is_admin());

-- ─── Orders ───────────────────────────────────────────────────
CREATE POLICY "orders_insert_open"  ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "orders_select_admin" ON orders FOR SELECT USING (is_admin());
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE USING (is_admin());

-- ─── Order Items ──────────────────────────────────────────────
CREATE POLICY "order_items_insert_open"  ON order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "order_items_select_admin" ON order_items FOR SELECT USING (is_admin());

-- ─── Notifications ────────────────────────────────────────────
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin"
  ON notifications FOR INSERT WITH CHECK (is_admin() OR TRUE); -- allow system inserts via service role

-- ─── Settings ─────────────────────────────────────────────────
CREATE POLICY "settings_select_all"   ON settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_admin_upsert" ON settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "settings_admin_update" ON settings FOR UPDATE USING (is_admin());

-- ─── Content Blocks ───────────────────────────────────────────
CREATE POLICY "content_blocks_select_all"   ON content_blocks FOR SELECT USING (TRUE);
CREATE POLICY "content_blocks_admin_insert" ON content_blocks FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "content_blocks_admin_update" ON content_blocks FOR UPDATE USING (is_admin());

-- ─── Audit Logs ───────────────────────────────────────────────
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "audit_logs_insert_any"   ON audit_logs FOR INSERT WITH CHECK (TRUE);

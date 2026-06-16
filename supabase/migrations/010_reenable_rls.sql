-- ============================================================
-- Migration 010 — Re-enable Row-Level Security
-- Reverses 004_remove_rls.sql, restores + improves all policies,
-- and tightens the anon role to public-read + guest-checkout only.
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Re-enable RLS on every table ────────────────────────────
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_packages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings                ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;

-- ─── Helper: is the current user an admin? ───────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ─── Helper: returns the artist.id of the current user ───────
CREATE OR REPLACE FUNCTION my_artist_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT id FROM artists WHERE profile_id = auth.uid() LIMIT 1);
END;
$$;

-- ─── Helper: is the current user a cones_manager? ────────────
CREATE OR REPLACE FUNCTION is_cones_manager()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'cones_manager'
  );
END;
$$;

-- ══════════════════════════════════════════════════════════════
-- PROFILES
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "profiles_select_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON profiles;

-- Users see only their own row; admins see all.
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

-- Users may update their own row but cannot change their role.
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ══════════════════════════════════════════════════════════════
-- ARTISTS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "artists_select_all"    ON artists;
DROP POLICY IF EXISTS "artists_admin_insert"  ON artists;
DROP POLICY IF EXISTS "artists_admin_update"  ON artists;
DROP POLICY IF EXISTS "artists_admin_delete"  ON artists;

CREATE POLICY "artists_select_all"    ON artists FOR SELECT USING (TRUE);
CREATE POLICY "artists_admin_insert"  ON artists FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "artists_admin_update"  ON artists FOR UPDATE USING (is_admin());
CREATE POLICY "artists_admin_delete"  ON artists FOR DELETE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- PACKAGES
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "packages_select_all"   ON packages;
DROP POLICY IF EXISTS "packages_admin_insert" ON packages;
DROP POLICY IF EXISTS "packages_admin_update" ON packages;
DROP POLICY IF EXISTS "packages_admin_delete" ON packages;

CREATE POLICY "packages_select_all"   ON packages FOR SELECT USING (TRUE);
CREATE POLICY "packages_admin_insert" ON packages FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "packages_admin_update" ON packages FOR UPDATE USING (is_admin());
CREATE POLICY "packages_admin_delete" ON packages FOR DELETE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- ARTIST PACKAGES
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "artist_packages_select_all"   ON artist_packages;
DROP POLICY IF EXISTS "artist_packages_admin_insert" ON artist_packages;
DROP POLICY IF EXISTS "artist_packages_admin_update" ON artist_packages;
DROP POLICY IF EXISTS "artist_packages_admin_delete" ON artist_packages;

CREATE POLICY "artist_packages_select_all"   ON artist_packages FOR SELECT USING (TRUE);
CREATE POLICY "artist_packages_admin_insert" ON artist_packages FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "artist_packages_admin_update" ON artist_packages FOR UPDATE USING (is_admin());
CREATE POLICY "artist_packages_admin_delete" ON artist_packages FOR DELETE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- ADD-ONS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "addons_select_all"   ON addons;
DROP POLICY IF EXISTS "addons_admin_insert" ON addons;
DROP POLICY IF EXISTS "addons_admin_update" ON addons;
DROP POLICY IF EXISTS "addons_admin_delete" ON addons;

CREATE POLICY "addons_select_all"   ON addons FOR SELECT USING (TRUE);
CREATE POLICY "addons_admin_insert" ON addons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "addons_admin_update" ON addons FOR UPDATE USING (is_admin());
CREATE POLICY "addons_admin_delete" ON addons FOR DELETE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- BOOKINGS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "bookings_select_own_or_admin"  ON bookings;
DROP POLICY IF EXISTS "bookings_select_artist"         ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own"            ON bookings;
DROP POLICY IF EXISTS "bookings_update_admin"          ON bookings;

-- Clients see their own; admins see all; assigned artists see theirs.
CREATE POLICY "bookings_select_own_or_admin"
  ON bookings FOR SELECT
  USING (
    client_id = auth.uid() OR
    is_admin() OR
    artist_id = my_artist_id()
  );

CREATE POLICY "bookings_insert_own"
  ON bookings FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "bookings_update_admin"
  ON bookings FOR UPDATE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- BOOKING ADD-ONS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "booking_addons_select_own_or_admin" ON booking_addons;
DROP POLICY IF EXISTS "booking_addons_insert_own"           ON booking_addons;

CREATE POLICY "booking_addons_select_own_or_admin"
  ON booking_addons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (b.client_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "booking_addons_insert_own"
  ON booking_addons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════
-- BOOKING STATUS HISTORY
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "booking_status_history_select"       ON booking_status_history;
DROP POLICY IF EXISTS "booking_status_history_insert_admin" ON booking_status_history;

CREATE POLICY "booking_status_history_select"
  ON booking_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (b.client_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "booking_status_history_insert_admin"
  ON booking_status_history FOR INSERT
  WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- PAYMENTS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON payments;
DROP POLICY IF EXISTS "payments_insert_own"           ON payments;
DROP POLICY IF EXISTS "payments_update_admin"         ON payments;

CREATE POLICY "payments_select_own_or_admin"
  ON payments FOR SELECT
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = auth.uid()
    )
  );

CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.client_id = auth.uid()
    )
  );

CREATE POLICY "payments_update_admin"
  ON payments FOR UPDATE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- PRODUCTS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "products_select_all"   ON products;
DROP POLICY IF EXISTS "products_admin_insert" ON products;
DROP POLICY IF EXISTS "products_admin_update" ON products;
DROP POLICY IF EXISTS "products_admin_delete" ON products;

CREATE POLICY "products_select_all"   ON products FOR SELECT USING (TRUE);
CREATE POLICY "products_admin_insert" ON products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "products_admin_update" ON products FOR UPDATE USING (is_admin());
CREATE POLICY "products_admin_delete" ON products FOR DELETE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- ORDERS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "orders_insert_open"         ON orders;
DROP POLICY IF EXISTS "orders_select_admin"         ON orders;
DROP POLICY IF EXISTS "orders_select_own_or_admin"  ON orders;
DROP POLICY IF EXISTS "orders_update_admin"         ON orders;

-- Guest checkout is intentional; allow open inserts.
CREATE POLICY "orders_insert_open"
  ON orders FOR INSERT WITH CHECK (TRUE);

-- Logged-in users see their own orders; admins and cones managers see all.
CREATE POLICY "orders_select_own_or_admin"
  ON orders FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_admin() OR
    is_cones_manager()
  );

CREATE POLICY "orders_update_admin"
  ON orders FOR UPDATE
  USING (is_admin() OR is_cones_manager());

-- ══════════════════════════════════════════════════════════════
-- ORDER ITEMS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "order_items_insert_open"         ON order_items;
DROP POLICY IF EXISTS "order_items_select_admin"         ON order_items;
DROP POLICY IF EXISTS "order_items_select_own_or_admin"  ON order_items;

CREATE POLICY "order_items_insert_open"
  ON order_items FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "order_items_select_own_or_admin"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_id
        AND (o.user_id = auth.uid() OR is_admin() OR is_cones_manager())
    )
  );

-- ══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "notifications_select_own"   ON notifications;
DROP POLICY IF EXISTS "notifications_update_own"   ON notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_auth"  ON notifications;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Any authenticated user may create notifications (app logic controls targeting).
CREATE POLICY "notifications_insert_auth"
  ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- SETTINGS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "settings_select_all"   ON settings;
DROP POLICY IF EXISTS "settings_admin_upsert" ON settings;
DROP POLICY IF EXISTS "settings_admin_update" ON settings;

CREATE POLICY "settings_select_all"   ON settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_admin_upsert" ON settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "settings_admin_update" ON settings FOR UPDATE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- CONTENT BLOCKS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "content_blocks_select_all"   ON content_blocks;
DROP POLICY IF EXISTS "content_blocks_admin_insert" ON content_blocks;
DROP POLICY IF EXISTS "content_blocks_admin_update" ON content_blocks;

CREATE POLICY "content_blocks_select_all"   ON content_blocks FOR SELECT USING (TRUE);
CREATE POLICY "content_blocks_admin_insert" ON content_blocks FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "content_blocks_admin_update" ON content_blocks FOR UPDATE USING (is_admin());

-- ══════════════════════════════════════════════════════════════
-- AUDIT LOGS
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_any"   ON audit_logs;

CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (is_admin());
CREATE POLICY "audit_logs_insert_any"   ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- ══════════════════════════════════════════════════════════════
-- TIGHTEN ANON GRANTS
-- 004_remove_rls.sql granted ALL on ALL TABLES to anon.
-- Revoke that and re-grant only what unauthenticated visitors need.
-- ══════════════════════════════════════════════════════════════
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Public browsing: read-only access to catalogue and CMS data.
GRANT SELECT ON artists, packages, artist_packages, addons,
               products, settings, content_blocks TO anon;

-- Guest checkout: insert-only on orders and their items.
GRANT INSERT ON orders, order_items TO anon;

-- ══════════════════════════════════════════════════════════════
-- RESTRICT ANALYTICS RPCs TO AUTHENTICATED USERS ONLY
-- 006_grant_execute.sql granted execute to anon — revoke that.
-- ══════════════════════════════════════════════════════════════
REVOKE EXECUTE ON FUNCTION get_revenue_summary(DATE, DATE)    FROM anon;
REVOKE EXECUTE ON FUNCTION get_monthly_revenue(DATE, DATE)    FROM anon;
REVOKE EXECUTE ON FUNCTION get_revenue_by_artist(DATE, DATE)  FROM anon;
REVOKE EXECUTE ON FUNCTION get_revenue_by_package(DATE, DATE) FROM anon;
REVOKE EXECUTE ON FUNCTION get_booking_metrics(DATE, DATE)    FROM anon;
REVOKE EXECUTE ON FUNCTION get_bookings_by_status(DATE, DATE) FROM anon;
REVOKE EXECUTE ON FUNCTION get_customer_metrics(DATE, DATE)   FROM anon;
REVOKE EXECUTE ON FUNCTION get_peak_days(DATE, DATE)          FROM anon;

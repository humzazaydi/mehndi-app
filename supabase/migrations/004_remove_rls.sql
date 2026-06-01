-- ============================================================
-- Remove Row-Level Security
-- Run AFTER 002_rls.sql (or standalone if starting fresh)
-- ============================================================

-- ─── Drop all policies ────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"                    ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"                    ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"                    ON profiles;

DROP POLICY IF EXISTS "artists_select_all"                     ON artists;
DROP POLICY IF EXISTS "artists_admin_insert"                   ON artists;
DROP POLICY IF EXISTS "artists_admin_update"                   ON artists;
DROP POLICY IF EXISTS "artists_admin_delete"                   ON artists;

DROP POLICY IF EXISTS "packages_select_all"                    ON packages;
DROP POLICY IF EXISTS "packages_admin_insert"                  ON packages;
DROP POLICY IF EXISTS "packages_admin_update"                  ON packages;
DROP POLICY IF EXISTS "packages_admin_delete"                  ON packages;

DROP POLICY IF EXISTS "artist_packages_select_all"             ON artist_packages;
DROP POLICY IF EXISTS "artist_packages_admin_insert"           ON artist_packages;
DROP POLICY IF EXISTS "artist_packages_admin_update"           ON artist_packages;
DROP POLICY IF EXISTS "artist_packages_admin_delete"           ON artist_packages;

DROP POLICY IF EXISTS "addons_select_all"                      ON addons;
DROP POLICY IF EXISTS "addons_admin_insert"                    ON addons;
DROP POLICY IF EXISTS "addons_admin_update"                    ON addons;
DROP POLICY IF EXISTS "addons_admin_delete"                    ON addons;

DROP POLICY IF EXISTS "bookings_select_own_or_admin"           ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own"                    ON bookings;
DROP POLICY IF EXISTS "bookings_update_admin"                  ON bookings;

DROP POLICY IF EXISTS "booking_addons_select_own_or_admin"     ON booking_addons;
DROP POLICY IF EXISTS "booking_addons_insert_own"              ON booking_addons;

DROP POLICY IF EXISTS "booking_status_history_select"          ON booking_status_history;
DROP POLICY IF EXISTS "booking_status_history_insert_admin"    ON booking_status_history;

DROP POLICY IF EXISTS "payments_select_own_or_admin"           ON payments;
DROP POLICY IF EXISTS "payments_insert_own"                    ON payments;
DROP POLICY IF EXISTS "payments_update_admin"                  ON payments;

DROP POLICY IF EXISTS "products_select_all"                    ON products;
DROP POLICY IF EXISTS "products_admin_insert"                  ON products;
DROP POLICY IF EXISTS "products_admin_update"                  ON products;
DROP POLICY IF EXISTS "products_admin_delete"                  ON products;

DROP POLICY IF EXISTS "orders_insert_open"                     ON orders;
DROP POLICY IF EXISTS "orders_select_admin"                    ON orders;
DROP POLICY IF EXISTS "orders_update_admin"                    ON orders;

DROP POLICY IF EXISTS "order_items_insert_open"                ON order_items;
DROP POLICY IF EXISTS "order_items_select_admin"               ON order_items;

DROP POLICY IF EXISTS "notifications_select_own"               ON notifications;
DROP POLICY IF EXISTS "notifications_update_own"               ON notifications;
DROP POLICY IF EXISTS "notifications_insert_admin"             ON notifications;

DROP POLICY IF EXISTS "settings_select_all"                    ON settings;
DROP POLICY IF EXISTS "settings_admin_upsert"                  ON settings;
DROP POLICY IF EXISTS "settings_admin_update"                  ON settings;

DROP POLICY IF EXISTS "content_blocks_select_all"              ON content_blocks;
DROP POLICY IF EXISTS "content_blocks_admin_insert"            ON content_blocks;
DROP POLICY IF EXISTS "content_blocks_admin_update"            ON content_blocks;

DROP POLICY IF EXISTS "audit_logs_select_admin"                ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_any"                  ON audit_logs;

-- ─── Disable RLS on all tables ────────────────────────────────
ALTER TABLE profiles                DISABLE ROW LEVEL SECURITY;
ALTER TABLE artists                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE packages                DISABLE ROW LEVEL SECURITY;
ALTER TABLE artist_packages         DISABLE ROW LEVEL SECURITY;
ALTER TABLE addons                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons          DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history  DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments                DISABLE ROW LEVEL SECURITY;
ALTER TABLE products                DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders                  DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items             DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings                DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks          DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated and anon roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

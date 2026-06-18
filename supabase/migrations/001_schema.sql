-- ============================================================
-- Henna Studio - Database Schema
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────
CREATE TYPE user_role       AS ENUM ('admin', 'client');
CREATE TYPE booking_status  AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected');
CREATE TYPE payment_status  AS ENUM ('pending', 'verified', 'rejected', 'refunded');
CREATE TYPE payment_method  AS ENUM ('meezan', 'hbl', 'easypaisa', 'jazzcash', 'cash');
CREATE TYPE payment_type    AS ENUM ('advance', 'balance', 'full');
CREATE TYPE order_status    AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE order_payment_method AS ENUM ('cod', 'bank_transfer');
CREATE TYPE order_payment_status AS ENUM ('pending', 'paid');
CREATE TYPE product_type    AS ENUM ('regular', 'organic');

-- ─── Profiles (extends auth.users) ───────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role   NOT NULL DEFAULT 'client',
  full_name   TEXT        NOT NULL DEFAULT '',
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Artists ──────────────────────────────────────────────────
CREATE TABLE artists (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  bio         TEXT,
  photo_url   TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Packages ─────────────────────────────────────────────────
CREATE TABLE packages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL,
  description TEXT,
  base_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order  INTEGER     NOT NULL DEFAULT 1,
  notes       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Artist-Package Mapping ───────────────────────────────────
CREATE TABLE artist_packages (
  id           UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id    UUID          NOT NULL REFERENCES artists(id)  ON DELETE CASCADE,
  package_id   UUID          NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  custom_price NUMERIC(10,2),
  is_available BOOLEAN       NOT NULL DEFAULT TRUE,
  UNIQUE(artist_id, package_id)
);

-- ─── Add-ons ──────────────────────────────────────────────────
CREATE TABLE addons (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT          NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Bookings ─────────────────────────────────────────────────
CREATE TABLE bookings (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number   TEXT           UNIQUE,
  client_id        UUID           NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  artist_id        UUID           REFERENCES artists(id) ON DELETE SET NULL,
  package_id       UUID           REFERENCES packages(id) ON DELETE SET NULL,
  status           booking_status NOT NULL DEFAULT 'pending',
  date             DATE           NOT NULL,
  time_slot        TEXT           NOT NULL,
  full_name        TEXT           NOT NULL,
  phone            TEXT           NOT NULL,
  alt_phone        TEXT,
  email            TEXT           NOT NULL,
  address          TEXT           NOT NULL,
  location_lat     DOUBLE PRECISION,
  location_lng     DOUBLE PRECISION,
  location_address TEXT,
  notes            TEXT,
  total_amount     NUMERIC(10,2)  NOT NULL DEFAULT 0,
  advance_amount   NUMERIC(10,2)  NOT NULL DEFAULT 0,
  paid_amount      NUMERIC(10,2)  NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(10,2)  NOT NULL DEFAULT 0,
  terms_accepted   BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Auto-generate booking number: MHD-YYYY-NNNN
CREATE SEQUENCE booking_seq START 1;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.booking_number := 'MHD-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(NEXTVAL('booking_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Booking Add-ons ──────────────────────────────────────────
CREATE TABLE booking_addons (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id       UUID          NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id         UUID          NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
  price_at_booking NUMERIC(10,2) NOT NULL,
  UNIQUE(booking_id, addon_id)
);

-- ─── Booking Status History ───────────────────────────────────
CREATE TABLE booking_status_history (
  id         UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID           NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status     booking_status NOT NULL,
  changed_by UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Auto-create initial status history entry
CREATE OR REPLACE FUNCTION create_initial_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO booking_status_history (booking_id, status, changed_by)
  VALUES (NEW.id, NEW.status, NEW.client_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_initial_status
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_initial_status_history();

-- Also log status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (booking_id, status)
    VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_status_change
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- ─── Payments ─────────────────────────────────────────────────
CREATE TABLE payments (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id     UUID           NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2)  NOT NULL,
  payment_method payment_method NOT NULL,
  transaction_id TEXT,
  receipt_url    TEXT,
  status         payment_status NOT NULL DEFAULT 'pending',
  payment_type   payment_type   NOT NULL,
  payment_date   DATE           NOT NULL,
  verified_by    UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at    TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Products (Cone Store) ────────────────────────────────────
CREATE TABLE products (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT         NOT NULL,
  type         product_type NOT NULL DEFAULT 'regular',
  price        NUMERIC(10,2) NOT NULL,
  min_quantity INTEGER      NOT NULL DEFAULT 1,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  description  TEXT
);

-- ─── Orders ───────────────────────────────────────────────────
CREATE TABLE orders (
  id              UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT                  UNIQUE,
  customer_name   TEXT                  NOT NULL,
  customer_phone  TEXT                  NOT NULL,
  customer_email  TEXT                  NOT NULL DEFAULT '',
  city            TEXT                  NOT NULL,
  address         TEXT                  NOT NULL,
  delivery_charge NUMERIC(10,2)         NOT NULL DEFAULT 0,
  payment_method  order_payment_method  NOT NULL,
  payment_status  order_payment_status  NOT NULL DEFAULT 'pending',
  order_status    order_status          NOT NULL DEFAULT 'pending',
  total_amount    NUMERIC(10,2)         NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- Auto-generate order number
CREATE SEQUENCE order_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.order_number := 'ORD-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(NEXTVAL('order_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ─── Order Items ──────────────────────────────────────────────
CREATE TABLE order_items (
  id         UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL
);

-- ─── Notifications ────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
  data       JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Settings ─────────────────────────────────────────────────
CREATE TABLE settings (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT        UNIQUE NOT NULL,
  value      JSONB       NOT NULL,
  updated_by UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Content Blocks (CMS) ─────────────────────────────────────
CREATE TABLE content_blocks (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT        UNIQUE NOT NULL,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL DEFAULT '',
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  updated_by UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────────
CREATE TABLE audit_logs (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action     TEXT        NOT NULL,
  table_name TEXT        NOT NULL,
  record_id  UUID,
  old_data   JSONB,
  new_data   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_bookings_client_id      ON bookings(client_id);
CREATE INDEX idx_bookings_artist_id      ON bookings(artist_id);
CREATE INDEX idx_bookings_status         ON bookings(status);
CREATE INDEX idx_bookings_date           ON bookings(date);
CREATE INDEX idx_payments_booking_id     ON payments(booking_id);
CREATE INDEX idx_payments_status         ON payments(status);
CREATE INDEX idx_notifications_user_id   ON notifications(user_id);
CREATE INDEX idx_notifications_is_read   ON notifications(user_id, is_read);
CREATE INDEX idx_order_items_order_id    ON order_items(order_id);

-- ─── Analytics RPC Functions ──────────────────────────────────

-- Revenue summary
CREATE OR REPLACE FUNCTION get_revenue_summary(date_from DATE, date_to DATE)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue',     COALESCE(SUM(b.total_amount) FILTER (WHERE b.status = 'completed'), 0),
    'verified_payments', COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.status = 'verified' AND p.payment_date BETWEEN date_from AND date_to), 0),
    'outstanding',       COALESCE(SUM(b.remaining_amount) FILTER (WHERE b.status NOT IN ('cancelled','rejected')), 0),
    'avg_booking_value', COALESCE(AVG(b.total_amount), 0)
  ) INTO result
  FROM bookings b
  WHERE b.date BETWEEN date_from AND date_to;
  RETURN result;
END;
$$;

-- Monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue(date_from DATE, date_to DATE)
RETURNS TABLE(month TEXT, revenue NUMERIC) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(b.date, 'Mon YYYY') AS month,
    COALESCE(SUM(p.amount), 0)  AS revenue
  FROM bookings b
  LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'verified'
  WHERE b.date BETWEEN date_from AND date_to
  GROUP BY TO_CHAR(b.date, 'Mon YYYY'), DATE_TRUNC('month', b.date)
  ORDER BY DATE_TRUNC('month', b.date);
END;
$$;

-- Revenue by artist
CREATE OR REPLACE FUNCTION get_revenue_by_artist(date_from DATE, date_to DATE)
RETURNS TABLE(artist_name TEXT, revenue NUMERIC) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(a.name, 'Unassigned') AS artist_name,
    COALESCE(SUM(p.amount), 0)     AS revenue
  FROM bookings b
  LEFT JOIN artists a ON a.id = b.artist_id
  LEFT JOIN payments p ON p.booking_id = b.id AND p.status = 'verified'
  WHERE b.date BETWEEN date_from AND date_to
  GROUP BY a.name
  ORDER BY revenue DESC;
END;
$$;

-- Revenue by package
CREATE OR REPLACE FUNCTION get_revenue_by_package(date_from DATE, date_to DATE)
RETURNS TABLE(package_name TEXT, revenue NUMERIC) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(pk.name, 'Unknown') AS package_name,
    COALESCE(SUM(b.total_amount), 0) AS revenue
  FROM bookings b
  LEFT JOIN packages pk ON pk.id = b.package_id
  WHERE b.date BETWEEN date_from AND date_to
  GROUP BY pk.name
  ORDER BY revenue DESC;
END;
$$;

-- Booking metrics
CREATE OR REPLACE FUNCTION get_booking_metrics(date_from DATE, date_to DATE)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total',     COUNT(*),
    'pending',   COUNT(*) FILTER (WHERE status = 'pending'),
    'confirmed', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'completed', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'rejected',  COUNT(*) FILTER (WHERE status = 'rejected')
  ) INTO result
  FROM bookings
  WHERE date BETWEEN date_from AND date_to;
  RETURN result;
END;
$$;

-- Bookings by status
CREATE OR REPLACE FUNCTION get_bookings_by_status(date_from DATE, date_to DATE)
RETURNS TABLE(status TEXT, count BIGINT) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT b.status::TEXT, COUNT(*)
  FROM bookings b
  WHERE b.date BETWEEN date_from AND date_to
  GROUP BY b.status;
END;
$$;

-- Customer metrics
CREATE OR REPLACE FUNCTION get_customer_metrics(date_from DATE, date_to DATE)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_customers',    COUNT(DISTINCT client_id),
    'returning_customers', COUNT(DISTINCT client_id) FILTER (WHERE booking_count > 1),
    'new_customers',       COUNT(DISTINCT client_id) FILTER (WHERE booking_count = 1),
    'avg_booking_value',   COALESCE(AVG(total_amount), 0)
  ) INTO result
  FROM (
    SELECT client_id, total_amount, COUNT(*) OVER (PARTITION BY client_id) AS booking_count
    FROM bookings
    WHERE date BETWEEN date_from AND date_to
  ) sub;
  RETURN result;
END;
$$;

-- Peak days
CREATE OR REPLACE FUNCTION get_peak_days(date_from DATE, date_to DATE)
RETURNS TABLE(day_name TEXT, booking_count BIGINT) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT TO_CHAR(date, 'Day') AS day_name, COUNT(*) AS booking_count
  FROM bookings
  WHERE date BETWEEN date_from AND date_to
  GROUP BY TO_CHAR(date, 'Day'), EXTRACT(DOW FROM date)
  ORDER BY EXTRACT(DOW FROM date);
END;
$$;

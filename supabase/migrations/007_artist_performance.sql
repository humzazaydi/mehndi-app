-- ============================================================
-- Artist Performance RPC Function
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION get_artist_performance(date_from DATE, date_to DATE)
RETURNS TABLE(
  artist_id          UUID,
  artist_name        TEXT,
  total_bookings     BIGINT,
  completed_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings   BIGINT,
  cancelled_bookings BIGINT,
  total_revenue      NUMERIC,
  avg_booking_value  NUMERIC,
  completion_rate    NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id                                                                              AS artist_id,
    a.name                                                                            AS artist_name,
    COUNT(b.id)                                                                       AS total_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'completed')                                AS completed_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'confirmed')                                AS confirmed_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'pending')                                  AS pending_bookings,
    COUNT(b.id) FILTER (WHERE b.status IN ('cancelled', 'rejected'))                 AS cancelled_bookings,
    COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'verified'), 0)                  AS total_revenue,
    COALESCE(AVG(b.total_amount), 0)                                                 AS avg_booking_value,
    CASE
      WHEN COUNT(b.id) > 0
        THEN ROUND(COUNT(b.id) FILTER (WHERE b.status = 'completed')::NUMERIC
             / COUNT(b.id) * 100, 1)
      ELSE 0
    END                                                                               AS completion_rate
  FROM artists a
  LEFT JOIN bookings b
    ON b.artist_id = a.id
    AND b.date BETWEEN date_from AND date_to
  LEFT JOIN payments p
    ON p.booking_id = b.id
  WHERE a.is_active = TRUE
  GROUP BY a.id, a.name
  ORDER BY total_revenue DESC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION get_artist_performance(DATE, DATE) TO authenticated, anon;

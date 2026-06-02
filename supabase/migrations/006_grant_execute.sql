-- ============================================================
-- Grant EXECUTE on all RPC/analytics functions
-- Run AFTER 001_schema.sql
-- ============================================================

GRANT EXECUTE ON FUNCTION get_revenue_summary(DATE, DATE)    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_monthly_revenue(DATE, DATE)    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_revenue_by_artist(DATE, DATE)  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_revenue_by_package(DATE, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_booking_metrics(DATE, DATE)    TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_bookings_by_status(DATE, DATE) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_customer_metrics(DATE, DATE)   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_peak_days(DATE, DATE)          TO authenticated, anon;

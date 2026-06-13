-- ============================================================
-- Enable Supabase Realtime for notification-critical tables
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- Add tables to the supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;
END $$;

-- REPLICA IDENTITY FULL lets realtime broadcast the complete old+new row on UPDATE/DELETE.
-- Required for bookings/orders (which use event: '*') so filters work on all event types.
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE bookings      REPLICA IDENTITY FULL;
ALTER TABLE orders        REPLICA IDENTITY FULL;

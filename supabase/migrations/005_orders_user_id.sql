-- Add user_id to orders so authenticated clients can track their own orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

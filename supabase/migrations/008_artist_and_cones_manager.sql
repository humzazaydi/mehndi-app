-- ============================================================
-- Henna Studio - Database Migration: Artist & Cones Manager
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Add new roles to user_role enum ────────────────────────
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction block in PostgreSQL.
-- If running into transaction issues, execute these statements individually.
ALTER TYPE user_role ADD VALUE 'artist';
ALTER TYPE user_role ADD VALUE 'cones_manager';

-- ─── Link artists table to profiles table ────────────────────
ALTER TABLE artists 
  ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL UNIQUE;

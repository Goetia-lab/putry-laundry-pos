-- Migration: Add pendingAmount and pendingCount to DailyClosing
-- Run this in Supabase SQL Editor (or psql) before using the new code.
-- Prisma generate will then sync the schema locally.

ALTER TABLE "DailyClosing" ADD COLUMN IF NOT EXISTS "pendingAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DailyClosing" ADD COLUMN IF NOT EXISTS "pendingCount" INTEGER NOT NULL DEFAULT 0;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'DailyClosing' AND column_name IN ('pendingAmount', 'pendingCount');

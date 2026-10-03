-- ============================================================
-- Bakewise ERP / BakeryOS — Branch Products Inventory Migration
-- Single Source of Truth for Current Branch Stock
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Create branch_products table
CREATE TABLE IF NOT EXISTS branch_products (
  id TEXT PRIMARY KEY, -- format: branch_1_p1 or branch_2_p1
  branch_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  available_quantity DECIMAL NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_branch_product UNIQUE (branch_id, product_id)
);

-- 2. Indexes for fast lookup by branch and product
CREATE INDEX IF NOT EXISTS idx_branch_products_branch ON branch_products(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_products_product ON branch_products(product_id);

-- 3. Disable RLS so POS and Branch terminals can read and write freely
ALTER TABLE branch_products DISABLE ROW LEVEL SECURITY;

-- 4. Enable Supabase Realtime for branch_products table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'branch_products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE branch_products;
  END IF;
END $$;

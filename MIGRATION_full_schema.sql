-- ============================================================
-- Bakewise ERP — Full Schema Setup (Safe, Idempotent)
-- Run this in Supabase SQL Editor.
-- NOTE: All foreign keys removed — app handles relationships
--       in code. This avoids UUID vs TEXT type conflicts.
-- ============================================================

-- 1. Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 2. Production Batches (JSONB items)
CREATE TABLE IF NOT EXISTS production_batches (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL DEFAULT '[]',
  date DATE NOT NULL,
  notes TEXT,
  sync_status TEXT DEFAULT 'synced'
);

-- 3. Dispatches
CREATE TABLE IF NOT EXISTS dispatches (
  id TEXT PRIMARY KEY,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'confirmed',
  items JSONB NOT NULL DEFAULT '[]',
  token_number INTEGER,
  sync_status TEXT DEFAULT 'synced'
);

-- 4. Sales
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  branch TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL NOT NULL,
  payment_method TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  is_credit_paid BOOLEAN DEFAULT true,
  date DATE NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 5. Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  branch_id TEXT,
  sync_status TEXT DEFAULT 'synced'
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Profiles (auth integration — no FK to products, safe)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Admin',
  email TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  branch_id TEXT,
  pin_code TEXT DEFAULT '0000',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add account_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS on profiles only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage their profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles linked to their account." ON profiles;
DROP POLICY IF EXISTS "Users can manage profiles linked to their account." ON profiles;

CREATE POLICY "Users can view their profiles" ON profiles
  FOR SELECT USING (auth.uid() = account_id);

CREATE POLICY "Users can manage their profiles" ON profiles
  FOR ALL USING (auth.uid() = account_id);

-- Auto-create admin profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (account_id, name, email, role, pin_code)
  VALUES (new.id, 'Bakery Admin', new.email, 'admin', '0000');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Raw Materials
CREATE TABLE IF NOT EXISTS raw_materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DECIMAL NOT NULL DEFAULT 0,
  min_stock_level DECIMAL NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL,
  supplier_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Raw Material Adjustments (NO FK — avoids type mismatch)
CREATE TABLE IF NOT EXISTS raw_material_adjustments (
  id TEXT PRIMARY KEY,
  material_id TEXT,
  type TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  reason TEXT,
  date DATE NOT NULL,
  user_id TEXT NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 10. Branch Stock Adjustments (NO FK — avoids UUID/TEXT conflict)
CREATE TABLE IF NOT EXISTS branch_stock_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  branch TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  reason TEXT,
  date DATE NOT NULL,
  user_id TEXT NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 11. Staff Members
CREATE TABLE IF NOT EXISTS staff_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  base_salary DECIMAL NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 12. Staff Deductions (NO FK)
CREATE TABLE IF NOT EXISTS staff_deductions (
  id TEXT PRIMARY KEY,
  staff_id TEXT,
  amount DECIMAL NOT NULL,
  reason TEXT,
  date DATE NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 13. Salary Vouchers (NO FK)
CREATE TABLE IF NOT EXISTS salary_vouchers (
  id TEXT PRIMARY KEY,
  staff_id TEXT,
  amount DECIMAL NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'paid',
  sync_status TEXT DEFAULT 'synced'
);

-- 14. Purchases (NO FK)
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  material_id TEXT,
  quantity DECIMAL NOT NULL,
  total_cost DECIMAL NOT NULL,
  amount_paid DECIMAL NOT NULL,
  payment_method TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_city TEXT,
  date DATE NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 15. Recipes (NO FK)
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  ingredients JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sync_status TEXT DEFAULT 'synced'
);

-- 16. Advance Orders
CREATE TABLE IF NOT EXISTS advance_orders (
  id TEXT PRIMARY KEY,
  branch TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total DECIMAL NOT NULL,
  delivery_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  notes TEXT,
  sync_status TEXT DEFAULT 'synced'
);

-- 17. Ledger Entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  account_head TEXT NOT NULL,
  account_type TEXT NOT NULL,
  debit DECIMAL DEFAULT 0,
  credit DECIMAL DEFAULT 0,
  name TEXT,
  station TEXT,
  account_no TEXT,
  closing_balance DECIMAL DEFAULT 0,
  category TEXT NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 18. App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (id, settings)
VALUES ('receipt_config', '{"brandName": "M.A BAKER''S", "tagline": "Quality You Can Trust", "address": "Jam Sahib Road, Nawabshah", "phone": "0329-7040402", "footerMessage1": "Thank you for visiting M.A BAKER''S!", "footerMessage2": "Powered by GenX Systems +923342826675"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Disable RLS on all operational tables
-- ============================================================
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE branch_stock_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_deductions DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE advance_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- Realtime publication
-- ============================================================
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
  products,
  production_batches,
  dispatches,
  sales,
  expenses,
  audit_logs,
  profiles,
  raw_materials,
  raw_material_adjustments,
  branch_stock_adjustments,
  staff_members,
  staff_deductions,
  salary_vouchers,
  purchases,
  recipes,
  advance_orders,
  ledger_entries,
  app_settings;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

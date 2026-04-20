-- Supabase SQL Schema for Bakewise ERP (Fixed for Snake Case compatibility)

-- Cleanup existing tables (uncomment if you want to completely reset)
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS expenses CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS dispatches CASCADE;
-- DROP TABLE IF EXISTS production_batches CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATE DEFAULT CURRENT_DATE
);
-- Safely add missing columns to products if they were created previously
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_active') THEN
    ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='created_at') THEN
    ALTER TABLE products ADD COLUMN created_at DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;


-- 2. Production Batches Table
CREATE TABLE IF NOT EXISTS production_batches (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  product_id TEXT REFERENCES products(id),
  quantity INTEGER NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  sync_status TEXT DEFAULT 'synced'
);

-- Safely add missing batch_id to production_batches
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='production_batches' AND column_name='batch_id') THEN
    ALTER TABLE production_batches ADD COLUMN batch_id TEXT;
    UPDATE production_batches SET batch_id = 'BCH-' || substring(md5(random()::text) from 1 for 6) WHERE batch_id IS NULL;
    ALTER TABLE production_batches ALTER COLUMN batch_id SET NOT NULL;
  END IF;
END $$;

-- 3. Dispatches Table
CREATE TABLE IF NOT EXISTS dispatches (
  id TEXT PRIMARY KEY,
  destination TEXT NOT NULL, -- 'branch_1', 'branch_2', 'walkin'
  date DATE NOT NULL,
  status TEXT DEFAULT 'confirmed',
  items JSONB NOT NULL, -- Array of {productId, quantity}
  token_number INTEGER,
  sync_status TEXT DEFAULT 'synced'
);

-- 4. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'branch', 'factory_walkin'
  branch TEXT, -- 'branch_1', 'branch_2'
  items JSONB NOT NULL, -- Array of {productId, quantity, unitPrice}
  total DECIMAL NOT NULL,
  payment_method TEXT NOT NULL,
  date DATE NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 5. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  branch_id TEXT, -- 'branch_1', 'branch_2', 'factory'
  sync_status TEXT DEFAULT 'synced'
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Profiles Table (Auth integration - Multi-profile support like Netflix)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT, -- Optional, used for identification
  role TEXT NOT NULL CHECK (role IN ('admin', 'production_manager', 'branch_staff', 'accountant')),
  branch_id TEXT CHECK (branch_id IN ('branch_1', 'branch_2')),
  pin_code TEXT DEFAULT '0000',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check if account_id column exists (in case table was created previously without it)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='account_id') THEN
    ALTER TABLE profiles ADD COLUMN account_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
DROP POLICY IF EXISTS "Users can view profiles linked to their account." ON profiles;
CREATE POLICY "Users can view profiles linked to their account." ON profiles
  FOR SELECT USING (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can manage profiles linked to their account." ON profiles;
CREATE POLICY "Users can manage profiles linked to their account." ON profiles
  FOR ALL USING (auth.uid() = account_id);

-- Handle primary admin profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (account_id, name, email, role, pin_code)
  VALUES (
    new.id, 
    'Bakery Admin', 
    new.email, 
    'admin',
    '0000'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Realtime for Sales and Production
-- Note: These are now idempotent and won't fail if already enabled.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add tables individually if they are not already in the publication
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sales') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sales;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'production_batches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE production_batches;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'dispatches') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dispatches;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
  END IF;
END $$;

-- 8. Raw Materials Table
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

-- 9. Raw Material Adjustments Table
CREATE TABLE IF NOT EXISTS raw_material_adjustments (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES raw_materials(id),
  type TEXT NOT NULL, -- 'in', 'out'
  quantity DECIMAL NOT NULL,
  reason TEXT,
  date DATE NOT NULL,
  user_id TEXT NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 10. Branch Stock Adjustments Table
CREATE TABLE IF NOT EXISTS branch_stock_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  branch TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  reason TEXT,
  date DATE NOT NULL,
  user_id TEXT NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- Add to Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'raw_materials') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE raw_materials;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'raw_material_adjustments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE raw_material_adjustments;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'branch_stock_adjustments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE branch_stock_adjustments;
  END IF;
END $$;

-- 11. Staff Members Table
CREATE TABLE IF NOT EXISTS staff_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  base_salary DECIMAL NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 12. Staff Deductions / Advances Table
CREATE TABLE IF NOT EXISTS staff_deductions (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES staff_members(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  reason TEXT,
  date DATE NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- 13. Salary Vouchers Table
CREATE TABLE IF NOT EXISTS salary_vouchers (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES staff_members(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  status TEXT DEFAULT 'paid',
  sync_status TEXT DEFAULT 'synced'
);

-- Add new tables to Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'staff_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE staff_members;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'staff_deductions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE staff_deductions;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'salary_vouchers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE salary_vouchers;
  END IF;
END $$;

-- 14. Credit Tracking Columns in Sales
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_name') THEN
    ALTER TABLE sales ADD COLUMN customer_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_phone') THEN
    ALTER TABLE sales ADD COLUMN customer_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='is_credit_paid') THEN
    ALTER TABLE sales ADD COLUMN is_credit_paid BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 15. Purchases Table (Raw Material Procurement)
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  material_id TEXT REFERENCES raw_materials(id),
  quantity DECIMAL NOT NULL,
  total_cost DECIMAL NOT NULL,
  amount_paid DECIMAL NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'credit'
  vendor_name TEXT NOT NULL,
  vendor_city TEXT,
  date DATE NOT NULL,
  sync_status TEXT DEFAULT 'synced'
);

-- Add to Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'purchases') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE purchases;
  END IF;
END $$;

-- 16b. Recipes Table (Missing — referenced in realtime publication)
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  ingredients JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sync_status TEXT DEFAULT 'synced'
);

-- Forcefully refresh the PostgREST API schema cache
NOTIFY pgrst, 'reload schema';


-- 16. App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    settings JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize with default settings if not exists
INSERT INTO app_settings (id, settings)
VALUES ('receipt_config', '{"brandName": "M.A BAKER''S", "tagline": "Quality You Can Trust", "logoUrl": "", "address": "Jam Sahib Road, Nawabshah", "phone": "0329-7040402", "footerMessage1": "Thank you for visiting M.A BAKER''S!", "footerMessage2": "Powered by genx systems +923342826675", "printedBy": "GENX ERP & POS SYSTEMS", "branch1Address": "Jam sahib road, nawabshah", "branch1Phone": "03297040402", "branch2Address": "Main chowk jam sahib road nawabshah", "branch2Phone": "03093660360", "dispatchAddress": "Factory Gate, Nawabshah", "dispatchPhone": "03297040402"}')
ON CONFLICT (id) DO NOTHING;

-- Add to Realtime
-- Enable Realtime for all tables
DO $$ 
BEGIN
  -- Re-create the publication to ensure it includes all tables
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
    recipes, 
    branch_stock_adjustments, 
    staff_members, 
    staff_deductions, 
    salary_vouchers, 
    purchases, 
    app_settings;
END $$;

-- Disable RLS for all tables to ensure seamless synchronization across all devices
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_material_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE branch_stock_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_deductions DISABLE ROW LEVEL SECURITY;
ALTER TABLE salary_vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

-- Final schema cache refresh to fix "column not found" errors
NOTIFY pgrst, 'reload schema';

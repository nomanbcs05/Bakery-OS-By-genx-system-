-- Migration: Add missing columns to the sales table
-- Run this in your Supabase SQL Editor to fix the 400 errors on POS sale submissions

-- Step 1: Add customer_name if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sales' AND column_name='customer_name'
  ) THEN
    ALTER TABLE sales ADD COLUMN customer_name TEXT;
    RAISE NOTICE 'Added column: customer_name';
  ELSE
    RAISE NOTICE 'Column customer_name already exists, skipping.';
  END IF;
END $$;

-- Step 2: Add customer_phone if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sales' AND column_name='customer_phone'
  ) THEN
    ALTER TABLE sales ADD COLUMN customer_phone TEXT;
    RAISE NOTICE 'Added column: customer_phone';
  ELSE
    RAISE NOTICE 'Column customer_phone already exists, skipping.';
  END IF;
END $$;

-- Step 3: Add is_credit_paid if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='sales' AND column_name='is_credit_paid'
  ) THEN
    ALTER TABLE sales ADD COLUMN is_credit_paid BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added column: is_credit_paid';
  ELSE
    RAISE NOTICE 'Column is_credit_paid already exists, skipping.';
  END IF;
END $$;

-- Verify the result
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;

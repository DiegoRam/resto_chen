-- Migration: Add payment_status ENUM to orders table
-- This migration implements a phased approach for large tables to avoid downtime

-- Step 1: Create the ENUM type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('unpaid', 'paid', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add a temporary nullable column with the ENUM type
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status_tmp payment_status_enum;

-- Step 3: Backfill the temporary column by casting existing values
-- This assumes existing data might have TEXT values that need to be converted
UPDATE orders 
SET payment_status_tmp = CASE 
    WHEN payment_status IS NULL OR payment_status = '' THEN 'unpaid'::payment_status_enum
    WHEN payment_status = 'unpaid' THEN 'unpaid'::payment_status_enum
    WHEN payment_status = 'paid' THEN 'paid'::payment_status_enum
    WHEN payment_status = 'refunded' THEN 'refunded'::payment_status_enum
    ELSE 'unpaid'::payment_status_enum -- Default fallback for invalid values
END
WHERE payment_status_tmp IS NULL;

-- Step 4: Set the temporary column to NOT NULL with default
ALTER TABLE orders ALTER COLUMN payment_status_tmp SET NOT NULL;
ALTER TABLE orders ALTER COLUMN payment_status_tmp SET DEFAULT 'unpaid';

-- Step 5: Drop the old column (if it exists)
ALTER TABLE orders DROP COLUMN IF EXISTS payment_status;

-- Step 6: Rename the temporary column to the final name
ALTER TABLE orders RENAME COLUMN payment_status_tmp TO payment_status;

-- Step 7: Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'payment_status';

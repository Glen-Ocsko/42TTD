/*
  # Fix Supplier Duplicates and Add Unique Constraint

  1. Changes
    - Check for duplicate supplier entries per user
    - Delete all but the most recent supplier record for each user
    - Add a unique constraint on user_id to prevent future duplicates
    
  2. Security
    - No security changes needed
    - Uses existing RLS policies
*/

-- First, identify users with multiple supplier records
WITH duplicate_suppliers AS (
  SELECT 
    user_id,
    COUNT(*) as record_count
  FROM suppliers
  GROUP BY user_id
  HAVING COUNT(*) > 1
),
-- For each user with duplicates, keep only the most recent record
suppliers_to_keep AS (
  SELECT DISTINCT ON (s.user_id) 
    s.id
  FROM suppliers s
  JOIN duplicate_suppliers ds ON s.user_id = ds.user_id
  ORDER BY s.user_id, s.created_at DESC
)
-- Delete all duplicate records except the most recent one
DELETE FROM suppliers
WHERE 
  user_id IN (SELECT user_id FROM duplicate_suppliers)
  AND id NOT IN (SELECT id FROM suppliers_to_keep);

-- Now add a unique constraint on user_id to prevent future duplicates
DO $$ 
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'suppliers_user_id_key'
  ) THEN
    ALTER TABLE suppliers ADD CONSTRAINT suppliers_user_id_key UNIQUE (user_id);
  END IF;
END $$;
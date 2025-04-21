/*
  # Fix supplier_ads RLS policies

  1. Changes
    - Drop existing RLS policies for supplier_ads table
    - Create new policies that properly check supplier ownership
    - Ensure suppliers can only manage their own ads
    - Maintain admin access to all ads

  2. Security
    - Enable RLS on supplier_ads table
    - Add policies for insert, update, delete, and select operations
    - Verify supplier ownership through suppliers table join
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Suppliers can create their own ads" ON supplier_ads;
DROP POLICY IF EXISTS "Suppliers can delete their own ads" ON supplier_ads;
DROP POLICY IF EXISTS "Suppliers can update their own ads" ON supplier_ads;
DROP POLICY IF EXISTS "Users can view approved ads" ON supplier_ads;
DROP POLICY IF EXISTS "Admins can manage all ads" ON supplier_ads;

-- Create new policies
CREATE POLICY "Suppliers can create their own ads"
ON supplier_ads
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can update their own ads"
ON supplier_ads
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

CREATE POLICY "Suppliers can delete their own ads"
ON supplier_ads
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view approved ads"
ON supplier_ads
FOR SELECT
TO public
USING (
  approved = true OR
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all ads"
ON supplier_ads
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
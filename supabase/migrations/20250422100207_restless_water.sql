/*
  # Fix Remaining uid() References in SQL - Part 4

  This migration completes the fixes for policies and functions,
  split into a separate file to avoid deadlocks.
*/

-- Fix any remaining policies in suppliers
DROP POLICY IF EXISTS "Users can create their own supplier profile" ON suppliers;
CREATE POLICY "Users can create their own supplier profile" 
  ON suppliers FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own supplier profile" ON suppliers;
CREATE POLICY "Users can update their own supplier profile" 
  ON suppliers FOR UPDATE TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in supplier_ads
DROP POLICY IF EXISTS "Suppliers can create their own ads" ON supplier_ads;
CREATE POLICY "Suppliers can create their own ads" 
  ON supplier_ads FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Suppliers can update their own ads" ON supplier_ads;
CREATE POLICY "Suppliers can update their own ads" 
  ON supplier_ads FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Suppliers can delete their own ads" ON supplier_ads;
CREATE POLICY "Suppliers can delete their own ads" 
  ON supplier_ads FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_ads.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

-- Fix any remaining policies in ad_feedback
DROP POLICY IF EXISTS "Users can create their own feedback" ON ad_feedback;
CREATE POLICY "Users can create their own feedback" 
  ON ad_feedback FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own feedback" ON ad_feedback;
CREATE POLICY "Users can view their own feedback" 
  ON ad_feedback FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in supplier_availability
DROP POLICY IF EXISTS "Suppliers can manage their own availability" ON supplier_availability;
CREATE POLICY "Suppliers can manage their own availability" 
  ON supplier_availability FOR ALL TO public
  USING (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_availability.supplier_id
    AND suppliers.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_availability.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

-- Fix any remaining policies in supplier_api_tokens
DROP POLICY IF EXISTS "Suppliers can create their own tokens" ON supplier_api_tokens;
CREATE POLICY "Suppliers can create their own tokens" 
  ON supplier_api_tokens FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_api_tokens.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Suppliers can delete their own tokens" ON supplier_api_tokens;
CREATE POLICY "Suppliers can delete their own tokens" 
  ON supplier_api_tokens FOR DELETE TO public
  USING (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_api_tokens.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Suppliers can view their own tokens" ON supplier_api_tokens;
CREATE POLICY "Suppliers can view their own tokens" 
  ON supplier_api_tokens FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = supplier_api_tokens.supplier_id
    AND suppliers.user_id = auth.uid()
  ));

-- Fix any remaining functions that might use uid() in get_supplier_bookings
CREATE OR REPLACE FUNCTION get_supplier_bookings(supplier_id uuid, status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  ad_id uuid,
  ad_title text,
  activity_id uuid,
  activity_title text,
  status text,
  message text,
  date date,
  booking_time time,
  price_total numeric,
  currency text,
  platform_fee numeric,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    p.username as user_name,
    p.email as user_email,
    b.ad_id,
    sa.title as ad_title,
    b.activity_id,
    a.title as activity_title,
    b.status,
    b.message,
    b.date,
    b.booking_time::time,
    b.price_total,
    b.currency,
    b.platform_fee,
    b.created_at
  FROM 
    bookings b
    LEFT JOIN profiles p ON b.user_id = p.id
    LEFT JOIN supplier_ads sa ON b.ad_id = sa.id
    LEFT JOIN activities a ON b.activity_id = a.id
  WHERE 
    b.supplier_id = get_supplier_bookings.supplier_id
    AND (status_filter IS NULL OR b.status = status_filter)
  ORDER BY 
    b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
/*
  # Fix Remaining uid() References in SQL - Part 5

  This migration completes the fixes for remaining functions,
  split into a separate file to avoid deadlocks.
*/

-- Fix any remaining functions that might use uid() in get_user_bookings
CREATE OR REPLACE FUNCTION get_user_bookings(user_id uuid, status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  supplier_id uuid,
  supplier_name text,
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
  created_at timestamptz,
  stripe_invoice_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.supplier_id,
    s.supplier_name,
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
    b.created_at,
    b.stripe_invoice_url
  FROM 
    bookings b
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    LEFT JOIN supplier_ads sa ON b.ad_id = sa.id
    LEFT JOIN activities a ON b.activity_id = a.id
  WHERE 
    b.user_id = get_user_bookings.user_id
    AND (status_filter IS NULL OR b.status = status_filter)
  ORDER BY 
    b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_supplier_available_dates
CREATE OR REPLACE FUNCTION get_supplier_available_dates(
  supplier_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  date date,
  available boolean,
  has_bookings boolean,
  note text
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
  ),
  availability AS (
    SELECT 
      sa.date,
      sa.available,
      sa.note
    FROM 
      supplier_availability sa
    WHERE 
      sa.supplier_id = get_supplier_available_dates.supplier_id
      AND sa.date BETWEEN start_date AND end_date
  ),
  bookings AS (
    SELECT 
      b.date,
      COUNT(*) > 0 AS has_bookings
    FROM 
      bookings b
    WHERE 
      b.supplier_id = get_supplier_available_dates.supplier_id
      AND b.date BETWEEN start_date AND end_date
      AND b.status != 'cancelled'
    GROUP BY 
      b.date
  )
  SELECT 
    dr.date,
    COALESCE(a.available, true) AS available,
    COALESCE(b.has_bookings, false) AS has_bookings,
    a.note
  FROM 
    date_range dr
    LEFT JOIN availability a ON dr.date = a.date
    LEFT JOIN bookings b ON dr.date = b.date
  ORDER BY 
    dr.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_supplier_payment_summary
CREATE OR REPLACE FUNCTION get_supplier_payment_summary(
  supplier_id uuid,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_revenue numeric,
  platform_fees numeric,
  supplier_earnings numeric,
  pending_payouts numeric,
  completed_payouts numeric,
  currency text
) AS $$
DECLARE
  supplier_currency text;
BEGIN
  -- Get supplier currency
  SELECT currency INTO supplier_currency FROM suppliers WHERE id = supplier_id;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(sp.amount), 0) AS total_revenue,
    COALESCE(SUM(sp.platform_fee), 0) AS platform_fees,
    COALESCE(SUM(sp.supplier_amount), 0) AS supplier_earnings,
    COALESCE((
      SELECT SUM(amount)
      FROM supplier_payouts
      WHERE supplier_id = get_supplier_payment_summary.supplier_id
      AND status IN ('pending', 'in_transit')
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    ), 0) AS pending_payouts,
    COALESCE((
      SELECT SUM(amount)
      FROM supplier_payouts
      WHERE supplier_id = get_supplier_payment_summary.supplier_id
      AND status = 'paid'
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    ), 0) AS completed_payouts,
    COALESCE(supplier_currency, 'GBP') AS currency
  FROM 
    supplier_payments sp
  WHERE 
    sp.supplier_id = get_supplier_payment_summary.supplier_id
    AND (start_date IS NULL OR sp.created_at >= start_date)
    AND (end_date IS NULL OR sp.created_at <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in update_booking_status
CREATE OR REPLACE FUNCTION update_booking_status(booking_id uuid, new_status text)
RETURNS boolean AS $$
DECLARE
  booking_exists boolean;
  is_supplier boolean;
  is_customer boolean;
BEGIN
  -- Check if booking exists
  SELECT EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_id
  ) INTO booking_exists;
  
  IF NOT booking_exists THEN
    RETURN false;
  END IF;
  
  -- Check if user is the supplier
  SELECT EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.id = booking_id
    AND s.user_id = auth.uid()
  ) INTO is_supplier;
  
  -- Check if user is the customer
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE id = booking_id
    AND user_id = auth.uid()
  ) INTO is_customer;
  
  -- Only allow update if user is supplier or customer
  IF NOT (is_supplier OR is_customer) THEN
    RETURN false;
  END IF;
  
  -- Suppliers can update to any status
  -- Customers can only cancel their bookings
  IF (is_supplier) OR (is_customer AND new_status = 'cancelled') THEN
    UPDATE bookings
    SET 
      status = new_status,
      updated_at = now()
    WHERE id = booking_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
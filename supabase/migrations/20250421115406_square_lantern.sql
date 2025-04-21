/*
  # Create Booking System

  1. New Tables
    - `bookings`
      - Stores booking information
      - Links to users, suppliers, ads, and activities
      - Includes status, dates, and payment information
    
    - `supplier_availability`
      - Stores supplier availability for booking
      - Allows suppliers to block out dates

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES supplier_ads(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  message text,
  date date NOT NULL,
  booking_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  price_total numeric(10,2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD')),
  platform_fee numeric(10,2) GENERATED ALWAYS AS (price_total * 0.1) STORED,
  stripe_payment_id text,
  stripe_invoice_url text
);

-- Create supplier_availability table
CREATE TABLE IF NOT EXISTS supplier_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  date date NOT NULL,
  available boolean DEFAULT true,
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(supplier_id, date)
);

-- Add currency field to suppliers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'currency'
  ) THEN
    ALTER TABLE suppliers ADD COLUMN currency text DEFAULT 'GBP' CHECK (currency IN ('GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can view bookings for their services"
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = bookings.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can update bookings for their services"
  ON bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = bookings.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Create policies for supplier_availability
CREATE POLICY "Anyone can view supplier availability"
  ON supplier_availability
  FOR SELECT
  USING (true);

CREATE POLICY "Suppliers can manage their own availability"
  ON supplier_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_availability.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_availability.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Create function to check if a date is available
CREATE OR REPLACE FUNCTION is_date_available(supplier_id uuid, check_date date)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM supplier_availability
    WHERE supplier_availability.supplier_id = $1
    AND supplier_availability.date = $2
    AND supplier_availability.available = false
  );
END;
$$;

-- Create function to get available dates for a supplier
CREATE OR REPLACE FUNCTION get_supplier_available_dates(supplier_id uuid, start_date date, end_date date)
RETURNS TABLE (
  date date,
  available boolean,
  has_bookings boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS date
  ),
  availability AS (
    SELECT 
      date,
      COALESCE(sa.available, true) AS available,
      EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.supplier_id = $1
        AND b.date = date
        AND b.status IN ('confirmed', 'pending')
      ) AS has_bookings
    FROM date_range
    LEFT JOIN supplier_availability sa ON sa.supplier_id = $1 AND sa.date = date_range.date
  )
  SELECT * FROM availability
  ORDER BY date;
END;
$$;

-- Create function to get bookings for a supplier
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    p.username AS user_name,
    p.email AS user_email,
    b.ad_id,
    sa.title AS ad_title,
    b.activity_id,
    a.title AS activity_title,
    b.status,
    b.message,
    b.date,
    b.booking_time,
    b.price_total,
    b.currency,
    b.platform_fee,
    b.created_at
  FROM bookings b
  LEFT JOIN profiles p ON p.id = b.user_id
  LEFT JOIN supplier_ads sa ON sa.id = b.ad_id
  LEFT JOIN activities a ON a.id = b.activity_id
  WHERE b.supplier_id = $1
  AND (status_filter IS NULL OR b.status = status_filter)
  ORDER BY b.date DESC, b.booking_time;
END;
$$;

-- Create function to get bookings for a user
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.supplier_id,
    s.supplier_name,
    b.ad_id,
    sa.title AS ad_title,
    b.activity_id,
    a.title AS activity_title,
    b.status,
    b.message,
    b.date,
    b.booking_time,
    b.price_total,
    b.currency,
    b.created_at,
    b.stripe_invoice_url
  FROM bookings b
  LEFT JOIN suppliers s ON s.id = b.supplier_id
  LEFT JOIN supplier_ads sa ON sa.id = b.ad_id
  LEFT JOIN activities a ON a.id = b.activity_id
  WHERE b.user_id = $1
  AND (status_filter IS NULL OR b.status = status_filter)
  ORDER BY b.date DESC, b.booking_time;
END;
$$;

-- Create function to update booking status
CREATE OR REPLACE FUNCTION update_booking_status(booking_id uuid, new_status text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE bookings
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = booking_id
  AND (
    -- User can only cancel their own bookings
    (new_status = 'cancelled' AND auth.uid() = user_id) OR
    -- Supplier can confirm, cancel, or complete bookings
    (new_status IN ('confirmed', 'cancelled', 'completed') AND EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = bookings.supplier_id
      AND suppliers.user_id = auth.uid()
    ))
  );
  
  RETURN FOUND;
END;
$$;
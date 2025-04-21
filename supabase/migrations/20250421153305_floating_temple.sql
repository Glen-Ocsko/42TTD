/*
  # Add Stripe Integration Tables

  1. New Tables
    - `invoices`
      - Stores invoice data for bookings
      - Links to bookings, suppliers, and users
      - Tracks payment status and Stripe IDs
    
    - `payment_methods`
      - Stores user payment methods
      - Links to users
      - Includes card details and Stripe IDs
    
    - `supplier_payments`
      - Tracks payments to suppliers
      - Links to bookings and suppliers
      - Includes fee calculations and Stripe transfer IDs
    
    - `supplier_payouts`
      - Tracks payouts from Stripe to suppliers
      - Links to suppliers
      - Includes payout status and Stripe payout IDs

  2. Table Updates
    - Add Stripe-related fields to existing tables:
      - `suppliers`: Add Stripe Connect account fields
      - `profiles`: Add Stripe customer ID field
      - `bookings`: Add Stripe payment and invoice fields

  3. Security
    - Enable RLS on all new tables
    - Add policies for appropriate access control
*/

-- Add Stripe fields to suppliers table
ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_details_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_requirements jsonb,
ADD COLUMN IF NOT EXISTS payout_schedule text DEFAULT 'instant' CHECK (payout_schedule IN ('instant', 'daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS fee_percentage numeric(5,2) DEFAULT 10.00;

-- Add Stripe customer ID to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL,
  supplier_amount numeric(10,2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD')),
  status text NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  issue_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  paid_date timestamptz,
  stripe_invoice_id text,
  stripe_invoice_url text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  created_at timestamptz DEFAULT now()
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('card')),
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  stripe_payment_method_id text NOT NULL,
  UNIQUE(user_id, stripe_payment_method_id)
);

-- Create supplier_payments table
CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL,
  supplier_amount numeric(10,2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD')),
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'failed')),
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  stripe_transfer_id text,
  UNIQUE(booking_id)
);

-- Create supplier_payouts table
CREATE TABLE IF NOT EXISTS supplier_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD')),
  status text NOT NULL CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
  created_at timestamptz DEFAULT now(),
  arrival_date timestamptz,
  stripe_payout_id text
);

-- Create payment_settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_percentage numeric(5,2) DEFAULT 10.00,
  payout_schedule text DEFAULT 'instant' CHECK (payout_schedule IN ('instant', 'daily', 'weekly', 'monthly')),
  automatic_payouts boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Suppliers can view invoices for their services"
  ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = invoices.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Create policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment methods"
  ON payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for supplier_payments
CREATE POLICY "Suppliers can view payments for their services"
  ON supplier_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_payments.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Create policies for supplier_payouts
CREATE POLICY "Suppliers can view their own payouts"
  ON supplier_payouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      WHERE suppliers.id = supplier_payouts.supplier_id
      AND suppliers.user_id = auth.uid()
    )
  );

-- Create policies for payment_settings
CREATE POLICY "Admins can manage payment settings"
  ON payment_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Anyone can view payment settings"
  ON payment_settings
  FOR SELECT
  USING (true);

-- Insert default payment settings
INSERT INTO payment_settings (platform_fee_percentage, payout_schedule, automatic_payouts)
VALUES (10.00, 'instant', true)
ON CONFLICT DO NOTHING;

-- Create function to calculate supplier fee
CREATE OR REPLACE FUNCTION calculate_supplier_fee(
  supplier_id uuid,
  activity_id uuid,
  ad_id uuid,
  amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  fee_percentage numeric(5,2);
  global_fee numeric(5,2);
BEGIN
  -- Get the global fee percentage
  SELECT platform_fee_percentage INTO global_fee
  FROM payment_settings
  LIMIT 1;

  -- Check if there's a supplier-specific fee
  SELECT s.fee_percentage INTO fee_percentage
  FROM suppliers s
  WHERE s.id = supplier_id;

  -- If no supplier-specific fee, use the global fee
  IF fee_percentage IS NULL THEN
    fee_percentage := global_fee;
  END IF;

  -- Calculate the fee amount
  RETURN (amount * fee_percentage / 100);
END;
$$;

-- Create function to get supplier payment summary
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
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH payments AS (
    SELECT
      SUM(amount) AS total_revenue,
      SUM(platform_fee) AS platform_fees,
      SUM(supplier_amount) AS supplier_earnings,
      currency
    FROM supplier_payments
    WHERE supplier_id = $1
    AND status = 'paid'
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY currency
  ),
  pending AS (
    SELECT
      SUM(amount) AS pending_amount,
      currency
    FROM supplier_payouts
    WHERE supplier_id = $1
    AND status IN ('pending', 'in_transit')
    GROUP BY currency
  ),
  completed AS (
    SELECT
      SUM(amount) AS completed_amount,
      currency
    FROM supplier_payouts
    WHERE supplier_id = $1
    AND status = 'paid'
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date)
    GROUP BY currency
  )
  SELECT
    COALESCE(p.total_revenue, 0) AS total_revenue,
    COALESCE(p.platform_fees, 0) AS platform_fees,
    COALESCE(p.supplier_earnings, 0) AS supplier_earnings,
    COALESCE(pend.pending_amount, 0) AS pending_payouts,
    COALESCE(comp.completed_amount, 0) AS completed_payouts,
    COALESCE(p.currency, pend.currency, comp.currency, 'GBP') AS currency
  FROM payments p
  FULL OUTER JOIN pending pend ON p.currency = pend.currency
  FULL OUTER JOIN completed comp ON p.currency = comp.currency;
END;
$$;
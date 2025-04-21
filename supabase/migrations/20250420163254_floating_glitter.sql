/*
  # Create Supplier Advertising System

  1. New Tables
    - `suppliers`
      - Stores supplier information
      - Links to auth.users
      - Includes approval status and supplier type
    
    - `supplier_ads`
      - Stores advertisement information
      - Links to suppliers
      - Includes approval status and discount information

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
*/

-- Create enum for supplier types
DO $$ BEGIN
  CREATE TYPE supplier_type AS ENUM ('business', 'peer', 'charity');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  supplier_name text NOT NULL,
  supplier_type supplier_type NOT NULL,
  description text,
  location text,
  website_url text,
  contact_email text NOT NULL,
  phone_number text,
  logo_url text,
  approved boolean DEFAULT false,
  trusted_supplier boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create supplier_ads table
CREATE TABLE IF NOT EXISTS supplier_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  cta_label text NOT NULL,
  cta_link text NOT NULL,
  activity_tags text[],
  location text,
  approved boolean DEFAULT false,
  highlight_discount boolean DEFAULT false,
  member_discount jsonb DEFAULT '{"all": "0%", "premium": "0%", "pro": "0%"}'::jsonb,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_ads ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers table
CREATE POLICY "Users can view approved suppliers"
  ON suppliers FOR SELECT
  USING (approved = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own supplier profile"
  ON suppliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own supplier profile"
  ON suppliers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all suppliers"
  ON suppliers
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Create policies for supplier_ads table
CREATE POLICY "Users can view approved ads"
  ON supplier_ads FOR SELECT
  USING (
    approved = true OR 
    EXISTS (
      SELECT 1 FROM suppliers 
      WHERE suppliers.id = supplier_ads.supplier_id 
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can create their own ads"
  ON supplier_ads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM suppliers 
      WHERE suppliers.id = supplier_ads.supplier_id 
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can update their own ads"
  ON supplier_ads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM suppliers 
      WHERE suppliers.id = supplier_ads.supplier_id 
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Suppliers can delete their own ads"
  ON supplier_ads FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM suppliers 
      WHERE suppliers.id = supplier_ads.supplier_id 
      AND suppliers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all ads"
  ON supplier_ads
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Create function to update ad metrics
CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE supplier_ads
  SET clicks = clicks + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE supplier_ads
  SET impressions = impressions + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql;

-- Insert demo data
INSERT INTO suppliers (
  id,
  user_id,
  supplier_name,
  supplier_type,
  description,
  location,
  website_url,
  contact_email,
  phone_number,
  logo_url,
  approved,
  trusted_supplier,
  created_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'Happy Tails Dog Rescue',
    'charity',
    'We rescue and rehome dogs in need, providing them with loving forever homes.',
    'London, UK',
    'https://example.com/happytails',
    'contact@happytails.example.com',
    '+44123456789',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '30 days'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'Harmony Music School',
    'business',
    'Professional music lessons for all ages and skill levels.',
    'Manchester, UK',
    'https://example.com/harmonymusic',
    'info@harmonymusic.example.com',
    '+44987654321',
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=200&h=200',
    true,
    false,
    now() - interval '20 days'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'Serene Yoga Retreats',
    'peer',
    'Beginner-friendly yoga retreats in beautiful natural settings.',
    'Cornwall, UK',
    'https://example.com/sereneyoga',
    'hello@sereneyoga.example.com',
    '+44555666777',
    'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '10 days'
  );

INSERT INTO supplier_ads (
  id,
  supplier_id,
  title,
  description,
  image_url,
  cta_label,
  cta_link,
  activity_tags,
  location,
  approved,
  highlight_discount,
  member_discount,
  clicks,
  impressions,
  created_at
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Adopt a Furry Friend Today',
    'Give a loving home to a dog in need. Our adoption process is simple and rewarding.',
    'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=800&h=500',
    'Meet Our Dogs',
    'https://example.com/happytails/adopt',
    ARRAY['Community & Events', 'Personal Growth'],
    'London, UK',
    true,
    true,
    '{"all": "10%", "premium": "20%", "pro": "30%"}',
    42,
    156,
    now() - interval '25 days'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'Learn Piano in 30 Days',
    'Our accelerated piano course will have you playing your favorite songs in just one month.',
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&h=500',
    'Book a Lesson',
    'https://example.com/harmonymusic/piano',
    ARRAY['Creative Expression', 'Personal Growth', 'Arts & Culture'],
    'Manchester, UK',
    true,
    true,
    '{"all": "10%", "premium": "15%", "pro": "25%"}',
    28,
    103,
    now() - interval '15 days'
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    'Weekend Yoga Retreat for Beginners',
    'Escape to the countryside for a rejuvenating weekend of yoga, meditation, and healthy food.',
    'https://images.unsplash.com/photo-1588286840104-8957b019727f?auto=format&fit=crop&w=800&h=500',
    'Reserve Your Spot',
    'https://example.com/sereneyoga/retreat',
    ARRAY['Health & Fitness', 'Personal Growth', 'Nature & Outdoors'],
    'Cornwall, UK',
    true,
    false,
    '{"all": "5%", "premium": "15%", "pro": "30%"}',
    35,
    128,
    now() - interval '5 days'
  );
/*
  # Add Category Images Table

  1. New Tables
    - `category_images` - Stores custom images for activity categories
  
  2. Changes
    - Create table for storing category images
    - Add relationship to activity_categories
    - Enable RLS on the new table
*/

-- Create category_images table
CREATE TABLE IF NOT EXISTS category_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES activity_categories(id) ON DELETE CASCADE,
  url text NOT NULL,
  keywords text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE category_images ENABLE ROW LEVEL SECURITY;

-- Create policies for category_images
CREATE POLICY "Admins can manage category images" 
  ON category_images FOR ALL TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

CREATE POLICY "Everyone can view category images" 
  ON category_images FOR SELECT TO public
  USING (true);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_category_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_images_updated_at
BEFORE UPDATE ON category_images
FOR EACH ROW
EXECUTE FUNCTION update_category_images_updated_at();

-- Add some default category images
INSERT INTO category_images (category_id, url, keywords)
SELECT 
  id, 
  CASE 
    WHEN name = 'Adventure & Adrenaline' THEN 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&h=600'
    WHEN name = 'Arts & Culture' THEN 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&h=600'
    WHEN name = 'Travel & Exploration' THEN 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=800&h=600'
    WHEN name = 'Food & Drink' THEN 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&h=600'
    WHEN name = 'Nature & Outdoors' THEN 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&h=600'
    WHEN name = 'Health & Fitness' THEN 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&h=600'
    WHEN name = 'Personal Growth' THEN 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&h=600'
    WHEN name = 'Social Impact' THEN 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=800&h=600'
    ELSE 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&h=600'
  END,
  name
FROM activity_categories
ON CONFLICT DO NOTHING;
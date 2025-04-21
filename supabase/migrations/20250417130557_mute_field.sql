/*
  # Update profiles table schema

  1. Changes
    - Add health-specific boolean columns with default values
    - Add age validation constraint (13-120)
    - Add gender validation constraint
    - Add created_at and updated_at timestamps

  2. Security
    - Check and conditionally create RLS policies
    - Ensure users can only update their own profiles
*/

-- Create enum type for gender if it doesn't exist
DO $$ BEGIN
  CREATE TYPE user_gender AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update profiles table
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    age integer CHECK (age >= 13 AND age <= 120),
    location text,
    gender user_gender DEFAULT 'prefer_not_to_say',
    health_heart_condition boolean DEFAULT false,
    health_fear_of_heights boolean DEFAULT false,
    health_limited_mobility boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz DEFAULT timezone('utc'::text, now())
  );
EXCEPTION
  WHEN duplicate_table THEN
    -- Add new columns if they don't exist
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS health_heart_condition boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS health_fear_of_heights boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS health_limited_mobility boolean DEFAULT false;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ BEGIN
  CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
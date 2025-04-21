/*
  # Add profile fields for onboarding

  1. Changes
    - Add new columns to profiles table for onboarding data
    - Add health considerations as an ENUM type
    - Add gender as an ENUM type
    - Add interests as a JSON array
    - Add check constraints for data validation

  2. Security
    - Maintain existing RLS policies
    - Data remains protected by user-specific policies
*/

-- Create ENUM types for structured data
DO $$ BEGIN
  CREATE TYPE user_gender AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS gender user_gender,
ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS health_considerations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add constraints
ALTER TABLE profiles
ADD CONSTRAINT age_check CHECK (age >= 13 AND age <= 120),
ADD CONSTRAINT health_considerations_check CHECK (
  health_considerations::jsonb @> '[]'::jsonb AND
  (health_considerations::jsonb ?| array['heart_condition', 'fear_of_heights', 'limited_mobility', 'none'])
);

-- Update the existing update policy to include new fields
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
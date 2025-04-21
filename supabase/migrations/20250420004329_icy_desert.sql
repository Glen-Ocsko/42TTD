/*
  # Update activities table RLS policies

  1. Changes
    - Add RLS policy to allow admin users to update activities
    - Ensure admin check uses the correct profile field

  2. Security
    - Only admins can update activities
    - Maintains existing read access for all users
*/

-- First ensure RLS is enabled
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Drop existing admin policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage activities" ON activities;

-- Create new admin policy with proper admin check
CREATE POLICY "Admins can manage activities"
ON activities
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
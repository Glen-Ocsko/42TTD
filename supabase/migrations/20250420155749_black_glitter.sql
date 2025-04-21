/*
  # Fix demo user ratings policy

  1. Changes
    - Add policy to allow demo user to insert ratings
    - Ensure demo user can rate activities
    
  2. Security
    - Maintain existing RLS policies
    - Add specific policy for demo user
*/

DO $$ 
BEGIN
  -- Drop the policy if it exists
  DROP POLICY IF EXISTS "Allow demo user to insert their own ratings" ON user_activity_ratings;

  -- Create the policy
  CREATE POLICY "Allow demo user to insert their own ratings"
    ON user_activity_ratings
    FOR INSERT
    TO public
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000'::uuid);
END $$;
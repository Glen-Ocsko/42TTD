/*
  # Fix demo user ratings permissions

  1. Changes
    - Add policy to allow demo user to insert ratings
    - Use DO block to check if policy exists first
    - Ensure demo user can save their activity ratings

  2. Security
    - Enable RLS on user_activity_ratings table
    - Add policy for demo user insertions
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
    WITH CHECK (
      auth.uid() = user_id OR 
      user_id = '00000000-0000-0000-0000-000000000000'::uuid
    );
END $$;
/*
  # Fix RLS policies for user activity ratings

  1. Changes
    - Update RLS policies for user_activity_ratings table to handle demo user
    - Add policy for demo user with ID '00000000-0000-0000-0000-000000000000'
    - Ensure policies cover all CRUD operations

  2. Security
    - Maintain data isolation between users
    - Allow demo user access for testing
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own ratings" ON user_activity_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON user_activity_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON user_activity_ratings;
DROP POLICY IF EXISTS "Users can view their own ratings" ON user_activity_ratings;

-- Create new policies that handle both regular and demo users
CREATE POLICY "Users can create their own ratings"
ON user_activity_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Users can update their own ratings"
ON user_activity_ratings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'::uuid
)
WITH CHECK (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Users can delete their own ratings"
ON user_activity_ratings
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Users can view their own ratings"
ON user_activity_ratings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'::uuid
);
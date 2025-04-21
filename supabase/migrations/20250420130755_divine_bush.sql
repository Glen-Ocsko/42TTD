/*
  # Fix RLS policies for user activity ratings

  1. Changes
    - Drop existing RLS policies for user_activity_ratings table
    - Create new comprehensive RLS policies that properly handle all operations
    
  2. Security
    - Enable RLS on user_activity_ratings table
    - Add policies for:
      - Users can insert their own ratings
      - Users can update their own ratings
      - Users can view their own ratings
      - Users can delete their own ratings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own ratings" ON user_activity_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON user_activity_ratings;
DROP POLICY IF EXISTS "Users can view their own ratings" ON user_activity_ratings;

-- Ensure RLS is enabled
ALTER TABLE user_activity_ratings ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies
CREATE POLICY "Users can create their own ratings"
ON user_activity_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON user_activity_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ratings"
ON user_activity_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
ON user_activity_ratings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
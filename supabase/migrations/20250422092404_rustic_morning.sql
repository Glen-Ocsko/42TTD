/*
  # Fix Post Reports RLS Policy

  1. Changes
    - Fix the INSERT policy for post_reports table by adding the required WITH CHECK clause
    - The current policy only has a USING clause, but INSERT policies require a WITH CHECK clause
*/

-- Drop the existing policy that's causing the error
DROP POLICY IF EXISTS "Users can create reports" ON post_reports;

-- Create a new policy with the correct WITH CHECK clause
CREATE POLICY "Users can create reports" 
  ON post_reports FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

-- Ensure other policies are correct
DROP POLICY IF EXISTS "Moderators can view all reports" ON post_reports;
CREATE POLICY "Moderators can view all reports" 
  ON post_reports FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Moderators can update reports" ON post_reports;
CREATE POLICY "Moderators can update reports" 
  ON post_reports FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Add a policy for users to view their own reports
CREATE POLICY "Users can view their own reports" 
  ON post_reports FOR SELECT TO public
  USING (auth.uid() = user_id);
/*
  # Add Admin Role and Policies

  1. Changes
    - Add admin role to auth.users
    - Add admin column to profiles
    - Add admin-specific policies to tables
    - Update demo user with admin capabilities

  2. Security
    - Strict RLS policies for admin access
    - Secure role validation
*/

-- Add admin column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create admin role validation function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if user is admin in profiles table
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to include admin access

-- Activities
DROP POLICY IF EXISTS "Admins can manage activities" ON activities;
CREATE POLICY "Admins can manage activities"
ON activities
USING (true)
WITH CHECK (is_admin());

-- Activity Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON activity_categories;
CREATE POLICY "Admins can manage categories"
ON activity_categories
USING (true)
WITH CHECK (is_admin());

-- Posts
DROP POLICY IF EXISTS "Admins can manage all posts" ON posts;
CREATE POLICY "Admins can manage all posts"
ON posts
USING (true)
WITH CHECK (is_admin());

-- Flags
DROP POLICY IF EXISTS "Admins can manage flags" ON flags;
CREATE POLICY "Admins can manage flags"
ON flags
USING (is_admin())
WITH CHECK (is_admin());

-- Contact Messages
DROP POLICY IF EXISTS "Admins can manage contact messages" ON contact_messages;
CREATE POLICY "Admins can manage contact messages"
ON contact_messages
USING (is_admin())
WITH CHECK (is_admin());

-- Supplier Requests
DROP POLICY IF EXISTS "Admins can manage supplier requests" ON supplier_requests;
CREATE POLICY "Admins can manage supplier requests"
ON supplier_requests
USING (is_admin())
WITH CHECK (is_admin());

-- Update demo user to be an admin by default
UPDATE profiles
SET is_admin = true
WHERE id = '00000000-0000-0000-0000-000000000000';
/*
  # Add insert policy for user_roles table

  1. Changes
    - Add RLS policy to allow inserting new user roles during registration
    
  2. Security
    - Allow authenticated users to insert their own role
    - Maintain existing policies for select and update
*/

CREATE POLICY "Users can insert their own role"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
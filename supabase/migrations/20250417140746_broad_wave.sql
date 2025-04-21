/*
  # Create user roles table and policies

  1. New Tables
    - `user_roles`
      - `user_id` (uuid, primary key, references auth.users)
      - `role` (text, check constraint: 'free', 'premium', 'pro')
      - `upgraded_at` (timestamp with time zone)

  2. Security
    - Enable RLS
    - Add policies for viewing and updating roles
*/

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text CHECK (role IN ('free', 'premium', 'pro')) DEFAULT 'free',
  upgraded_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own role
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow updates through service role (handled by edge functions)
CREATE POLICY "Service role can update roles"
  ON user_roles FOR UPDATE
  USING (auth.uid() = user_id);
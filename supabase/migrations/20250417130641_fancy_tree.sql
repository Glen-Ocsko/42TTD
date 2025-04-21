/*
  # Create user interests table

  1. New Tables
    - `user_interests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `category` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can view their own interests
      - Users can create their own interests
      - Users can delete their own interests

  3. Constraints
    - Foreign key to profiles table
    - Unique constraint on user_id and category combination
*/

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own interests"
  ON user_interests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interests"
  ON user_interests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests"
  ON user_interests
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
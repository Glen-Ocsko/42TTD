/*
  # Add custom activities table

  1. New Tables
    - `custom_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `description` (text, optional)
      - `category_tags` (text array)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `custom_activities` table
    - Add policies for users to manage their own custom activities
*/

CREATE TABLE IF NOT EXISTS custom_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_tags text[],
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own custom activities"
  ON custom_activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own custom activities"
  ON custom_activities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom activities"
  ON custom_activities
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom activities"
  ON custom_activities
  FOR DELETE
  USING (auth.uid() = user_id);
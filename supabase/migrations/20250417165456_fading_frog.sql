/*
  # Add Activity Posts System

  1. New Tables
    - `activity_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `activity_id` (uuid, references activities)
      - `custom_activity_id` (uuid, references custom_activities)
      - `content` (text)
      - `image_url` (text)
      - `status` (text: in_progress, completed)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for:
      - Public read access
      - Authenticated users can create posts
      - Users can update/delete their own posts
*/

CREATE TABLE activity_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  custom_activity_id uuid REFERENCES custom_activities(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  status text CHECK (status IN ('in_progress', 'completed')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  CONSTRAINT activity_reference_check CHECK (
    (activity_id IS NOT NULL AND custom_activity_id IS NULL) OR
    (activity_id IS NULL AND custom_activity_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE activity_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view posts"
  ON activity_posts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON activity_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON activity_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON activity_posts
  FOR DELETE
  USING (auth.uid() = user_id);
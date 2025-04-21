/*
  # Create Coaching & Nudges Tables

  1. New Tables
    - `nudges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `activity_id` (uuid, references activities)
      - `message` (text)
      - `scheduled_at` (timestamptz)
      - `sent` (boolean)
      - `created_at` (timestamptz)
    
    - `habits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `activity_id` (uuid, references activities)
      - `title` (text)
      - `frequency` (text)
      - `target_count` (integer)
      - `current_count` (integer)
      - `last_checked_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for user access
*/

-- Create nudges table
CREATE TABLE IF NOT EXISTS nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  message text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  title text NOT NULL,
  frequency text NOT NULL,
  target_count integer NOT NULL,
  current_count integer DEFAULT 0,
  last_checked_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  CONSTRAINT frequency_check CHECK (frequency IN ('daily', 'weekly', 'monthly'))
);

-- Enable RLS
ALTER TABLE nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Nudges policies
CREATE POLICY "Users can view their own nudges"
  ON nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own nudges"
  ON nudges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nudges"
  ON nudges FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nudges"
  ON nudges FOR DELETE
  USING (auth.uid() = user_id);

-- Habits policies
CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);
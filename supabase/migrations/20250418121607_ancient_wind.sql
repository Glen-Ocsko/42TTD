/*
  # Update user activities policies for demo mode

  1. Changes
    - Add policies to allow demo user to manage activities
    - Fix foreign key constraint for activity_posts
    - Maintain existing table structure and constraints

  2. Security
    - Enable RLS
    - Add policies for both authenticated and demo users
*/

-- Add foreign key to activity_posts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'activity_posts_user_id_fkey'
  ) THEN
    ALTER TABLE activity_posts
    ADD CONSTRAINT activity_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create user_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  privacy text DEFAULT 'private' CHECK (privacy IN ('public', 'friends', 'private')),
  target_date date,
  priority integer CHECK (priority >= 1 AND priority <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create their own activities" ON user_activities;
  DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
  DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;
  DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;
END $$;

-- Create policies for user_activities
CREATE POLICY "Users can create their own activities"
ON user_activities FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
);

CREATE POLICY "Users can view their own activities"
ON user_activities FOR SELECT
TO public
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
);

CREATE POLICY "Users can update their own activities"
ON user_activities FOR UPDATE
TO public
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
)
WITH CHECK (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
);

CREATE POLICY "Users can delete their own activities"
ON user_activities FOR DELETE
TO public
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
);
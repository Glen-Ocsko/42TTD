/*
  # Fix Posts Table and Add Sample Data

  1. Changes
    - Drop and recreate posts table with proper relationships
    - Add foreign key to auth.users instead of profiles
    - Add sample data with proper error handling
    - Set up RLS policies

  2. Security
    - Enable RLS
    - Add policies for CRUD operations
*/

-- Drop existing posts table if it exists
DROP TABLE IF EXISTS posts CASCADE;

-- Create posts table with correct relationships
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  content text NOT NULL,
  media_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Create sample data
DO $$ 
DECLARE 
  demo_user_id uuid;
  activity_id uuid;
BEGIN
  -- Get the demo user's ID
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'demo@example.com' 
  LIMIT 1;

  -- Get a sample activity ID
  SELECT id INTO activity_id 
  FROM activities 
  LIMIT 1;

  -- Only proceed if we have both IDs
  IF demo_user_id IS NOT NULL AND activity_id IS NOT NULL THEN
    -- Add sample posts
    INSERT INTO posts (user_id, activity_id, content, created_at)
    VALUES
      (
        demo_user_id,
        activity_id,
        'Just started this amazing activity! Looking forward to the journey ahead.',
        now() - interval '2 days'
      ),
      (
        demo_user_id,
        activity_id,
        'Made some great progress today. The experience has been incredible so far!',
        now() - interval '1 day'
      ),
      (
        demo_user_id,
        activity_id,
        'Finally completed it! What an amazing experience. Highly recommend to everyone!',
        now() - interval '2 hours'
      );
  END IF;
END $$;
/*
  # Fix Activity Posts and RLS Policies

  1. Changes
    - Add foreign key from activity_posts to profiles
    - Update RLS policies for activity_posts and user_activities
    - Fix relationship between activity_posts and profiles
    - Add support for demo user

  2. Security
    - Enable RLS on all tables
    - Add policies for both authenticated and demo users
*/

-- Drop existing foreign key if it exists
ALTER TABLE activity_posts
DROP CONSTRAINT IF EXISTS activity_posts_user_id_fkey;

-- Add correct foreign key to activity_posts
ALTER TABLE activity_posts
ADD CONSTRAINT activity_posts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view posts" ON activity_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON activity_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON activity_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON activity_posts;

-- Create new policies for activity_posts
CREATE POLICY "Anyone can view posts"
ON activity_posts FOR SELECT
USING (true);

CREATE POLICY "Users can create posts"
ON activity_posts FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
);

CREATE POLICY "Users can update their own posts"
ON activity_posts FOR UPDATE
TO public
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
);

CREATE POLICY "Users can delete their own posts"
ON activity_posts FOR DELETE
TO public
USING (
  auth.uid() = user_id OR 
  user_id = '00000000-0000-0000-0000-000000000000'
);

-- Drop existing policies for user_activities
DROP POLICY IF EXISTS "Users can create their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;

-- Create new policies for user_activities
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
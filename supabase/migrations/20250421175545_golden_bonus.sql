/*
  # Add Social Features for Community

  1. New Tables
    - `post_likes` - Stores likes on posts
    - `post_comments` - Stores comments on posts
    - `post_reports` - Stores reports on posts
    - `user_hashtags` - Stores hashtags followed by users

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
*/

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES activity_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES activity_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  gif_url text,
  emoji_reactions text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create post_reports table
CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES activity_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  extra_notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Create user_hashtags table
CREATE TABLE IF NOT EXISTS user_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  hashtag_id uuid REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, hashtag_id)
);

-- Enable RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies for post_likes
CREATE POLICY "Anyone can view likes"
  ON post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for post_comments
CREATE POLICY "Anyone can view comments"
  ON post_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for post_reports
CREATE POLICY "Users can report posts"
  ON post_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can view reports"
  ON post_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update reports"
  ON post_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create policies for user_hashtags
CREATE POLICY "Users can view their own followed hashtags"
  ON user_hashtags
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can follow hashtags"
  ON user_hashtags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow hashtags"
  ON user_hashtags
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to extract hashtags from post content
CREATE OR REPLACE FUNCTION extract_hashtags(content text)
RETURNS text[] AS $$
DECLARE
  hashtags text[];
BEGIN
  -- Extract hashtags using regex
  SELECT ARRAY(
    SELECT DISTINCT LOWER(hashtag)
    FROM regexp_matches(content, '#([A-Za-z0-9_]+)', 'g') AS hashtag
  ) INTO hashtags;
  
  RETURN hashtags;
END;
$$ LANGUAGE plpgsql;

-- Create function to get posts with hashtag
CREATE OR REPLACE FUNCTION get_posts_with_hashtag(tag_name text)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM activity_posts p
  WHERE p.content ILIKE '%#' || tag_name || '%'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get followed hashtags for a user
CREATE OR REPLACE FUNCTION get_user_followed_hashtags(user_id uuid)
RETURNS TABLE (
  hashtag_id uuid,
  hashtag_name text,
  post_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id AS hashtag_id,
    h.name AS hashtag_name,
    h.post_count
  FROM user_hashtags uh
  JOIN hashtags h ON uh.hashtag_id = h.id
  WHERE uh.user_id = $1
  ORDER BY h.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get posts with followed hashtags
CREATE OR REPLACE FUNCTION get_posts_with_followed_hashtags(user_id uuid)
RETURNS SETOF activity_posts AS $$
DECLARE
  hashtag_names text[];
BEGIN
  -- Get hashtags followed by user
  SELECT ARRAY(
    SELECT h.name
    FROM user_hashtags uh
    JOIN hashtags h ON uh.hashtag_id = h.id
    WHERE uh.user_id = $1
  ) INTO hashtag_names;
  
  -- Return posts containing any of these hashtags
  RETURN QUERY
  SELECT DISTINCT p.*
  FROM activity_posts p
  WHERE EXISTS (
    SELECT 1
    FROM unnest(hashtag_names) AS tag
    WHERE p.content ILIKE '%#' || tag || '%'
  )
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get posts from friends
CREATE OR REPLACE FUNCTION get_posts_from_friends(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.*
  FROM activity_posts p
  WHERE p.user_id IN (
    -- Get users who the current user follows and who follow the current user back
    SELECT f1.following_id
    FROM follows f1
    JOIN follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
    WHERE f1.follower_id = $1
    AND f1.status = 'accepted'
    AND f2.status = 'accepted'
  )
  AND p.visibility = 'public'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get posts from followed users
CREATE OR REPLACE FUNCTION get_posts_from_following(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.*
  FROM activity_posts p
  WHERE p.user_id IN (
    -- Get users who the current user follows
    SELECT following_id
    FROM follows
    WHERE follower_id = $1
    AND status = 'accepted'
  )
  AND p.visibility = 'public'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add hashtags column to activity_posts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_posts' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE activity_posts ADD COLUMN hashtags text[];
  END IF;
END $$;

-- Create trigger to extract and store hashtags when a post is created or updated
CREATE OR REPLACE FUNCTION update_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  extracted_tags text[];
  tag text;
  tag_id uuid;
BEGIN
  -- Extract hashtags from content
  extracted_tags := extract_hashtags(NEW.content);
  
  -- Store the extracted hashtags in the post
  NEW.hashtags := extracted_tags;
  
  -- For each hashtag, insert into hashtags table if it doesn't exist
  FOREACH tag IN ARRAY extracted_tags
  LOOP
    INSERT INTO hashtags (name)
    VALUES (tag)
    ON CONFLICT (name) DO 
    UPDATE SET post_count = hashtags.post_count + 1;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS update_post_hashtags_trigger ON activity_posts;
CREATE TRIGGER update_post_hashtags_trigger
BEFORE INSERT OR UPDATE OF content ON activity_posts
FOR EACH ROW
EXECUTE FUNCTION update_post_hashtags();

-- Add visibility column to activity_posts if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activity_posts' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE activity_posts ADD COLUMN visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private'));
  END IF;
END $$;
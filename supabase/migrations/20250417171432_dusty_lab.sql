/*
  # Social Features Schema

  1. New Tables
    - `social_posts`: Main posts table with rich media support
    - `comments`: Nested comments on posts
    - `reactions`: Emoji reactions (like, love, etc.)
    - `mentions`: User mentions in posts/comments
    - `hashtags`: Hashtag tracking
    - `bookmarks`: Save posts for later

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
*/

-- Create enum for reaction types if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reaction_type') THEN
    CREATE TYPE reaction_type AS ENUM ('like', 'love', 'celebrate', 'support', 'insightful');
  END IF;
END $$;

-- Create social posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  content text,
  media_urls text[], -- Array of media URLs (images/videos)
  media_type text[] CHECK (media_type <@ ARRAY['image', 'video']), -- Corresponding media types
  location text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
  edited_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT media_arrays_match CHECK (array_length(media_urls, 1) = array_length(media_type, 1))
);

-- Create comments table with nested replies
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  edited_at timestamptz
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  reaction reaction_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id, comment_id, reaction)
);

-- Create mentions table
CREATE TABLE IF NOT EXISTS mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Create hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  post_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create post_hashtags junction table
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  hashtag_id uuid REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, hashtag_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS on all tables
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- Drop social_posts policies
  DROP POLICY IF EXISTS "Users can view public posts and friends' posts" ON social_posts;
  DROP POLICY IF EXISTS "Users can create their own posts" ON social_posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON social_posts;
  DROP POLICY IF EXISTS "Users can delete their own posts" ON social_posts;

  -- Drop comments policies
  DROP POLICY IF EXISTS "Anyone can view comments on viewable posts" ON comments;
  DROP POLICY IF EXISTS "Users can create comments" ON comments;
  DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
  DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

  -- Drop reactions policies
  DROP POLICY IF EXISTS "Anyone can view reactions" ON reactions;
  DROP POLICY IF EXISTS "Users can create reactions" ON reactions;
  DROP POLICY IF EXISTS "Users can delete their own reactions" ON reactions;

  -- Drop mentions policies
  DROP POLICY IF EXISTS "Users can view mentions" ON mentions;
  DROP POLICY IF EXISTS "Users can create mentions" ON mentions;

  -- Drop hashtags policies
  DROP POLICY IF EXISTS "Anyone can view hashtags" ON hashtags;
  DROP POLICY IF EXISTS "Anyone can view post hashtags" ON post_hashtags;

  -- Drop bookmarks policies
  DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
  DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
  DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
END $$;

-- Create policies for social_posts
CREATE POLICY "Users can view public posts and friends' posts"
  ON social_posts FOR SELECT
  USING (
    visibility = 'public'
    OR (
      visibility = 'friends'
      AND EXISTS (
        SELECT 1 FROM friendships
        WHERE (
          (friendships.user_id = auth.uid() AND friendships.friend_id = social_posts.user_id)
          OR (friendships.friend_id = auth.uid() AND friendships.user_id = social_posts.user_id)
        )
        AND friendships.status = 'accepted'
      )
    )
    OR (visibility = 'private' AND user_id = auth.uid())
  );

CREATE POLICY "Users can create their own posts"
  ON social_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON social_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON social_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for comments
CREATE POLICY "Anyone can view comments on viewable posts"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM social_posts
      WHERE social_posts.id = comments.post_id
      AND (
        social_posts.visibility = 'public'
        OR (
          social_posts.visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM friendships
            WHERE (
              (friendships.user_id = auth.uid() AND friendships.friend_id = social_posts.user_id)
              OR (friendships.friend_id = auth.uid() AND friendships.user_id = social_posts.user_id)
            )
            AND friendships.status = 'accepted'
          )
        )
        OR (social_posts.visibility = 'private' AND social_posts.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for reactions
CREATE POLICY "Anyone can view reactions"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for mentions
CREATE POLICY "Users can view mentions"
  ON mentions FOR SELECT
  USING (auth.uid() IN (user_id, mentioned_user_id));

CREATE POLICY "Users can create mentions"
  ON mentions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for hashtags and post_hashtags
CREATE POLICY "Anyone can view hashtags"
  ON hashtags FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view post hashtags"
  ON post_hashtags FOR SELECT
  USING (true);

-- Create policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Create or replace functions and triggers
CREATE OR REPLACE FUNCTION update_hashtag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags
    SET post_count = post_count + 1
    WHERE id = NEW.hashtag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags
    SET post_count = post_count - 1
    WHERE id = OLD.hashtag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_hashtag_count ON post_hashtags;
CREATE TRIGGER update_hashtag_count
AFTER INSERT OR DELETE ON post_hashtags
FOR EACH ROW
EXECUTE FUNCTION update_hashtag_count();

-- Create or replace hashtag processing function
CREATE OR REPLACE FUNCTION process_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag text;
  hashtag_id uuid;
BEGIN
  -- Delete existing hashtags for this post if updating
  IF TG_OP = 'UPDATE' THEN
    DELETE FROM post_hashtags WHERE post_id = NEW.id;
  END IF;

  -- Extract hashtags using regex
  FOR hashtag IN
    SELECT DISTINCT LOWER(hashtag)
    FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') AS hashtag
  LOOP
    -- Insert hashtag if it doesn't exist
    INSERT INTO hashtags (name)
    VALUES (hashtag)
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO hashtag_id;

    -- If hashtag_id is null, get it from existing hashtag
    IF hashtag_id IS NULL THEN
      SELECT id INTO hashtag_id FROM hashtags WHERE name = hashtag;
    END IF;

    -- Link hashtag to post
    INSERT INTO post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, hashtag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for hashtag extraction
DROP TRIGGER IF EXISTS process_post_hashtags ON social_posts;
CREATE TRIGGER process_post_hashtags
AFTER INSERT OR UPDATE OF content ON social_posts
FOR EACH ROW
EXECUTE FUNCTION process_post_hashtags();
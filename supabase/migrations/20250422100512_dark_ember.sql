/*
  # Fix Remaining uid() References in SQL - Part 2 (Fixed)

  This migration continues fixing policies and functions,
  with proper function dropping to avoid return type errors.
*/

-- Fix any remaining policies in post_likes
DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
CREATE POLICY "Users can like posts" 
  ON post_likes FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;
CREATE POLICY "Users can unlike posts" 
  ON post_likes FOR DELETE TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in post_comments
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
CREATE POLICY "Users can create comments" 
  ON post_comments FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;
CREATE POLICY "Users can delete their own comments" 
  ON post_comments FOR DELETE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
CREATE POLICY "Users can update their own comments" 
  ON post_comments FOR UPDATE TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in messages
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" 
  ON messages FOR INSERT TO public
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update messages they received" ON messages;
CREATE POLICY "Users can update messages they received" 
  ON messages FOR UPDATE TO public
  USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" 
  ON messages FOR SELECT TO public
  USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));

-- Fix any remaining policies in user_roles
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
CREATE POLICY "Users can insert their own role" 
  ON user_roles FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
CREATE POLICY "Users can update their own role" 
  ON user_roles FOR UPDATE TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role" 
  ON user_roles FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in user_interests
DROP POLICY IF EXISTS "Users can create own interests" ON user_interests;
CREATE POLICY "Users can create own interests" 
  ON user_interests FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own interests" ON user_interests;
CREATE POLICY "Users can delete own interests" 
  ON user_interests FOR DELETE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
CREATE POLICY "Users can view own interests" 
  ON user_interests FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining functions that might use uid() in get_user_followed_hashtags
-- First drop the existing function to avoid return type errors
DROP FUNCTION IF EXISTS get_user_followed_hashtags(uuid);

-- Then recreate it with the correct signature
CREATE OR REPLACE FUNCTION get_user_followed_hashtags(user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  hashtag_id uuid,
  hashtag_name text,
  post_count bigint,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uh.id,
    uh.user_id,
    uh.hashtag_id,
    h.name as hashtag_name,
    h.post_count,
    uh.created_at
  FROM 
    user_hashtags uh
    JOIN hashtags h ON uh.hashtag_id = h.id
  WHERE 
    uh.user_id = get_user_followed_hashtags.user_id
  ORDER BY 
    h.post_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_posts_from_following
DROP FUNCTION IF EXISTS get_posts_from_following(uuid);

CREATE OR REPLACE FUNCTION get_posts_from_following(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT ap.*
  FROM activity_posts ap
  JOIN follows f ON ap.user_id = f.following_id
  WHERE f.follower_id = user_id
  AND f.status = 'accepted'
  AND ap.visibility = 'public'
  ORDER BY ap.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
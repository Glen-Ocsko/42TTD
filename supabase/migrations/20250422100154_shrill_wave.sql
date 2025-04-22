/*
  # Fix Remaining uid() References in SQL - Part 3

  This migration completes the fixes for policies and functions,
  split into a separate file to avoid deadlocks.
*/

-- Fix any remaining policies in user_hashtags
DROP POLICY IF EXISTS "Users can follow hashtags" ON user_hashtags;
CREATE POLICY "Users can follow hashtags" 
  ON user_hashtags FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unfollow hashtags" ON user_hashtags;
CREATE POLICY "Users can unfollow hashtags" 
  ON user_hashtags FOR DELETE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own followed hashtags" ON user_hashtags;
CREATE POLICY "Users can view their own followed hashtags" 
  ON user_hashtags FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in bookmarks
DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
CREATE POLICY "Users can create bookmarks" 
  ON bookmarks FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
CREATE POLICY "Users can delete their own bookmarks" 
  ON bookmarks FOR DELETE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
CREATE POLICY "Users can view their own bookmarks" 
  ON bookmarks FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in bookings
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" 
  ON bookings FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings" 
  ON bookings FOR UPDATE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in payment_methods
DROP POLICY IF EXISTS "Users can create their own payment methods" ON payment_methods;
CREATE POLICY "Users can create their own payment methods" 
  ON payment_methods FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;
CREATE POLICY "Users can delete their own payment methods" 
  ON payment_methods FOR DELETE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
CREATE POLICY "Users can update their own payment methods" 
  ON payment_methods FOR UPDATE TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
CREATE POLICY "Users can view their own payment methods" 
  ON payment_methods FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining functions that might use uid() in get_posts_from_friends
CREATE OR REPLACE FUNCTION get_posts_from_friends(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT ap.*
  FROM activity_posts ap
  WHERE ap.user_id IN (
    SELECT f1.following_id
    FROM follows f1
    JOIN follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
    WHERE f1.follower_id = user_id
    AND f1.status = 'accepted'
    AND f2.status = 'accepted'
  )
  AND (ap.visibility = 'public' OR ap.visibility = 'friends')
  ORDER BY ap.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_posts_with_followed_hashtags
CREATE OR REPLACE FUNCTION get_posts_with_followed_hashtags(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ap.*
  FROM activity_posts ap
  JOIN user_hashtags uh ON uh.user_id = get_posts_with_followed_hashtags.user_id
  JOIN hashtags h ON uh.hashtag_id = h.id
  WHERE ap.visibility = 'public'
  AND ap.content ILIKE '%#' || h.name || '%'
  ORDER BY ap.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
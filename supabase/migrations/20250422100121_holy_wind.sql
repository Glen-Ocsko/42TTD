/*
  # Fix Remaining uid() References in SQL - Part 1

  This migration focuses on fixing the most critical policies first,
  breaking up the large transaction to avoid deadlocks.
*/

-- Fix any remaining policies in post_reports
DROP POLICY IF EXISTS "Users can create reports" ON post_reports;
CREATE POLICY "Users can create reports" 
  ON post_reports FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON post_reports;
CREATE POLICY "Users can view their own reports" 
  ON post_reports FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix any remaining policies in activity_posts
DROP POLICY IF EXISTS "Users can create posts" ON activity_posts;
CREATE POLICY "Users can create posts" 
  ON activity_posts FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));

DROP POLICY IF EXISTS "Users can delete their own posts" ON activity_posts;
CREATE POLICY "Users can delete their own posts" 
  ON activity_posts FOR DELETE TO public
  USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));

DROP POLICY IF EXISTS "Users can update their own posts" ON activity_posts;
CREATE POLICY "Users can update their own posts" 
  ON activity_posts FOR UPDATE TO public
  USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid))
  WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));

-- Fix any remaining policies in profiles
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile" 
  ON profiles FOR INSERT TO public
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Fix any remaining policies in user_activities
DROP POLICY IF EXISTS "Users can create their own activities" ON user_activities;
CREATE POLICY "Users can create their own activities" 
  ON user_activities FOR INSERT TO public
  WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));

DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;
CREATE POLICY "Users can delete their own activities" 
  ON user_activities FOR DELETE TO public
  USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));

DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;
CREATE POLICY "Users can update their own activities" 
  ON user_activities FOR UPDATE TO public
  USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid))
  WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));

DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
CREATE POLICY "Users can view their own activities" 
  ON user_activities FOR SELECT TO public
  USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));

-- Fix any remaining policies in follows
DROP POLICY IF EXISTS "Users can create follow requests" ON follows;
CREATE POLICY "Users can create follow requests" 
  ON follows FOR INSERT TO public
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can update follow status for requests they receive" ON follows;
CREATE POLICY "Users can update follow status for requests they receive" 
  ON follows FOR UPDATE TO public
  USING ((auth.uid() = follower_id) OR (auth.uid() = following_id));

DROP POLICY IF EXISTS "Users can view their own follows" ON follows;
CREATE POLICY "Users can view their own follows" 
  ON follows FOR SELECT TO public
  USING ((auth.uid() = follower_id) OR (auth.uid() = following_id));

-- Fix any remaining functions that might use uid()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_follow_status
CREATE OR REPLACE FUNCTION get_follow_status(user_id uuid, target_id uuid)
RETURNS text AS $$
DECLARE
  follow_status text;
BEGIN
  -- Check if user follows target
  SELECT 
    CASE 
      WHEN status = 'accepted' THEN 
        -- Check if target also follows user (mutual/friends)
        CASE WHEN EXISTS (
          SELECT 1 FROM follows 
          WHERE follower_id = target_id 
          AND following_id = user_id
          AND status = 'accepted'
        ) THEN 'friends' ELSE 'following' END
      WHEN status = 'pending' THEN 'requested'
      ELSE status
    END INTO follow_status
  FROM follows
  WHERE follower_id = user_id
  AND following_id = target_id
  LIMIT 1;
  
  -- Check if target follows user but user doesn't follow target
  IF follow_status IS NULL THEN
    SELECT 
      CASE WHEN status = 'pending' THEN 'pending' ELSE NULL END INTO follow_status
    FROM follows
    WHERE follower_id = target_id
    AND following_id = user_id
    LIMIT 1;
  END IF;
  
  -- Default to 'none' if no relationship exists
  RETURN COALESCE(follow_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
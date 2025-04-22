/*
  # Privacy-Enforced Moderation System

  1. Changes
    - Add privacy enforcement to moderation queue
    - Ensure moderators can only see reported posts
    - Update post_reports table with additional fields
    - Create functions to enforce privacy controls
  
  2. Security
    - Restrict moderator access to only reported content
    - Respect user privacy settings for non-reported content
*/

-- Add visibility field to post_reports if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'post_reports' AND column_name = 'post_visibility') THEN
    ALTER TABLE post_reports ADD COLUMN post_visibility text;
  END IF;
END $$;

-- Create function to get only reported posts for moderation
CREATE OR REPLACE FUNCTION get_reported_posts_for_moderation()
RETURNS TABLE (
  report_id uuid,
  post_id uuid,
  reporter_id uuid,
  reporter_username text,
  reported_user_id uuid,
  reported_username text,
  post_content text,
  image_url text,
  reason text,
  extra_notes text,
  status text,
  created_at timestamptz,
  post_visibility text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id as report_id,
    pr.post_id,
    pr.user_id as reporter_id,
    reporter.username as reporter_username,
    ap.user_id as reported_user_id,
    reported.username as reported_username,
    ap.content as post_content,
    ap.image_url,
    pr.reason,
    pr.extra_notes,
    pr.status,
    pr.created_at,
    ap.visibility as post_visibility
  FROM 
    post_reports pr
    JOIN activity_posts ap ON pr.post_id = ap.id
    JOIN profiles reporter ON pr.user_id = reporter.id
    JOIN profiles reported ON ap.user_id = reported.id
  WHERE 
    pr.status = 'pending' OR pr.status = 'in_review'
  ORDER BY 
    pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if moderator can access a specific post
CREATE OR REPLACE FUNCTION can_moderator_access_post(post_id uuid, moderator_id uuid)
RETURNS boolean AS $$
DECLARE
  post_exists boolean;
  is_reported boolean;
  post_visibility text;
  is_mod_or_admin boolean;
BEGIN
  -- Check if user is moderator or admin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = moderator_id AND (is_moderator = true OR is_admin = true)
  ) INTO is_mod_or_admin;
  
  IF NOT is_mod_or_admin THEN
    RETURN false;
  END IF;
  
  -- Check if post exists and get its visibility
  SELECT EXISTS (
    SELECT 1 FROM activity_posts WHERE id = post_id
  ), 
  (SELECT visibility FROM activity_posts WHERE id = post_id)
  INTO post_exists, post_visibility;
  
  IF NOT post_exists THEN
    RETURN false;
  END IF;
  
  -- If post is public, moderator can access
  IF post_visibility = 'public' THEN
    RETURN true;
  END IF;
  
  -- Check if post has been reported
  SELECT EXISTS (
    SELECT 1 FROM post_reports WHERE post_id = post_id
  ) INTO is_reported;
  
  -- Moderator can only access non-public posts if they've been reported
  RETURN is_reported;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy to restrict moderator access to activity_posts
DROP POLICY IF EXISTS "Moderators can only view reported or public posts" ON activity_posts;
CREATE POLICY "Moderators can only view reported or public posts" 
  ON activity_posts FOR SELECT TO public
  USING (
    (visibility = 'public') OR 
    (EXISTS (
      SELECT 1 FROM post_reports WHERE post_id = id
    ) AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_moderator = true OR profiles.is_admin = true)
    ))
  );

-- Update post_reports table to store post visibility at time of report
CREATE OR REPLACE FUNCTION update_post_report_visibility()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE post_reports
  SET post_visibility = (SELECT visibility FROM activity_posts WHERE id = NEW.post_id)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update post visibility in reports
DROP TRIGGER IF EXISTS update_post_report_visibility_trigger ON post_reports;
CREATE TRIGGER update_post_report_visibility_trigger
AFTER INSERT ON post_reports
FOR EACH ROW
EXECUTE FUNCTION update_post_report_visibility();

-- Create function to get moderation stats respecting privacy
CREATE OR REPLACE FUNCTION get_moderation_stats()
RETURNS TABLE (
  total_reports bigint,
  open_reports bigint,
  resolved_reports bigint,
  dismissed_reports bigint,
  warnings_issued bigint,
  posts_removed bigint,
  users_suspended bigint,
  users_banned bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM post_reports) as total_reports,
    (SELECT COUNT(*) FROM post_reports WHERE status = 'pending') as open_reports,
    (SELECT COUNT(*) FROM post_reports WHERE status = 'resolved') as resolved_reports,
    (SELECT COUNT(*) FROM post_reports WHERE status = 'dismissed') as dismissed_reports,
    (SELECT COUNT(*) FROM moderation_actions WHERE action = 'warn') as warnings_issued,
    (SELECT COUNT(*) FROM moderation_actions WHERE action = 'delete') as posts_removed,
    (SELECT COUNT(*) FROM user_suspensions WHERE is_permanent = false OR is_permanent IS NULL) as users_suspended,
    (SELECT COUNT(*) FROM user_suspensions WHERE is_permanent = true) as users_banned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

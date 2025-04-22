/*
  # Fix uid() Function in RLS Policies

  1. Changes
    - Replace all instances of uid() with auth.uid() in RLS policies
    - This fixes the "function uid() does not exist" error
    - Affects all moderation-related tables and their policies
*/

-- Fix policies for moderation_actions
DROP POLICY IF EXISTS "Moderators can create moderation actions" ON moderation_actions;
CREATE POLICY "Moderators can create moderation actions" 
  ON moderation_actions FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Moderators can view all moderation actions" ON moderation_actions;
CREATE POLICY "Moderators can view all moderation actions" 
  ON moderation_actions FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Fix policies for user_suspensions
DROP POLICY IF EXISTS "Moderators can create user suspensions" ON user_suspensions;
CREATE POLICY "Moderators can create user suspensions" 
  ON user_suspensions FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Moderators can update user suspensions" ON user_suspensions;
CREATE POLICY "Moderators can update user suspensions" 
  ON user_suspensions FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Moderators can view all user suspensions" ON user_suspensions;
CREATE POLICY "Moderators can view all user suspensions" 
  ON user_suspensions FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Fix policies for moderation_messages
DROP POLICY IF EXISTS "Moderators can create messages" ON moderation_messages;
CREATE POLICY "Moderators can create messages" 
  ON moderation_messages FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Moderators can view all messages" ON moderation_messages;
CREATE POLICY "Moderators can view all messages" 
  ON moderation_messages FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Users can mark messages as read" ON moderation_messages;
CREATE POLICY "Users can mark messages as read" 
  ON moderation_messages FOR UPDATE TO public
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id AND read = true);

DROP POLICY IF EXISTS "Users can view messages sent to them" ON moderation_messages;
CREATE POLICY "Users can view messages sent to them" 
  ON moderation_messages FOR SELECT TO public
  USING (auth.uid() = receiver_id);

-- Fix policies for post_reports
DROP POLICY IF EXISTS "Users can create reports" ON post_reports;
CREATE POLICY "Users can create reports" 
  ON post_reports FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Moderators can view all reports" ON post_reports;
CREATE POLICY "Moderators can view all reports" 
  ON post_reports FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

DROP POLICY IF EXISTS "Moderators can update reports" ON post_reports;
CREATE POLICY "Moderators can update reports" 
  ON post_reports FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Fix any other policies that might be using uid() in other migrations
DROP POLICY IF EXISTS "Users can view their own reports" ON post_reports;
CREATE POLICY "Users can view their own reports" 
  ON post_reports FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Fix policies in moderation appeals if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_appeals') THEN
    DROP POLICY IF EXISTS "Users can create their own appeals" ON moderation_appeals;
    CREATE POLICY "Users can create their own appeals" 
      ON moderation_appeals FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can view their own appeals" ON moderation_appeals;
    CREATE POLICY "Users can view their own appeals" 
      ON moderation_appeals FOR SELECT TO public
      USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Moderators can view all appeals" ON moderation_appeals;
    CREATE POLICY "Moderators can view all appeals" 
      ON moderation_appeals FOR SELECT TO public
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.is_moderator = true OR profiles.is_admin = true)
      ));
    
    DROP POLICY IF EXISTS "Moderators can update appeals" ON moderation_appeals;
    CREATE POLICY "Moderators can update appeals" 
      ON moderation_appeals FOR UPDATE TO public
      USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.is_moderator = true OR profiles.is_admin = true)
      ));
  END IF;
END $$;

-- Fix policies in messages table for moderator messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'from_moderator') THEN
    DROP POLICY IF EXISTS "Moderators can send messages to any user" ON messages;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE policyname = 'Moderators can send messages to any user'
        AND tablename = 'messages'
    ) THEN
      CREATE POLICY "Moderators can send messages to any user" 
        ON messages FOR INSERT TO public
        WITH CHECK (
          (auth.uid() = sender_id) AND 
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_moderator = true OR profiles.is_admin = true)
          )
        );
    END IF;
  END IF;
END $$;


-- Fix any other policies in other tables that might be using uid()
DO $$
BEGIN
  -- Fix policies in activity_posts table
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_posts' AND policyname = 'Moderators can only view reported or public posts') THEN
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
  END IF;
END $$;
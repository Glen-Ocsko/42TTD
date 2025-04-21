-- Add moderation columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Check if is_moderator column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_moderator'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_moderator boolean DEFAULT false;
    RAISE NOTICE 'Added is_moderator column to profiles table';
  ELSE
    RAISE NOTICE 'is_moderator column already exists in profiles table, skipping';
  END IF;

  -- Check if is_admin column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
    RAISE NOTICE 'Added is_admin column to profiles table';
  ELSE
    RAISE NOTICE 'is_admin column already exists in profiles table, skipping';
  END IF;

  -- Check if is_suspended column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
    RAISE NOTICE 'Added is_suspended column to profiles table';
  ELSE
    RAISE NOTICE 'is_suspended column already exists in profiles table, skipping';
  END IF;

  -- Check if is_banned column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false;
    RAISE NOTICE 'Added is_banned column to profiles table';
  ELSE
    RAISE NOTICE 'is_banned column already exists in profiles table, skipping';
  END IF;
END $$;

-- Check if moderation_actions table exists and create if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'moderation_actions') THEN
    CREATE TABLE moderation_actions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      action_type text NOT NULL CHECK (action_type IN ('warning', 'post_removal', 'suspension', 'ban', 'report_dismissed', 'report_resolved', 'escalated')),
      reason text NOT NULL,
      notes text,
      target_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      post_id uuid REFERENCES activity_posts(id) ON DELETE SET NULL,
      moderator_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

    -- Create policies for moderation_actions
    CREATE POLICY "Moderators can view all moderation actions"
      ON moderation_actions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND (profiles.is_moderator = true OR profiles.is_admin = true)
        )
      );

    CREATE POLICY "Moderators can create moderation actions"
      ON moderation_actions
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND (profiles.is_moderator = true OR profiles.is_admin = true)
        )
      );

    RAISE NOTICE 'Created moderation_actions table';
  ELSE
    RAISE NOTICE 'moderation_actions table already exists, skipping creation';
  END IF;
END $$;

-- Check if user_suspensions table exists and create if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_suspensions') THEN
    CREATE TABLE user_suspensions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
      reason text NOT NULL,
      start_date timestamptz DEFAULT now(),
      end_date timestamptz,
      created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

    -- Create policies for user_suspensions
    CREATE POLICY "Moderators can view all user suspensions"
      ON user_suspensions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND (profiles.is_moderator = true OR profiles.is_admin = true)
        )
      );

    CREATE POLICY "Moderators can create user suspensions"
      ON user_suspensions
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND (profiles.is_moderator = true OR profiles.is_admin = true)
        )
      );

    CREATE POLICY "Moderators can update user suspensions"
      ON user_suspensions
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND (profiles.is_moderator = true OR profiles.is_admin = true)
        )
      );

    RAISE NOTICE 'Created user_suspensions table';
  ELSE
    RAISE NOTICE 'user_suspensions table already exists, skipping creation';
  END IF;
END $$;

-- Create function to check if user is a moderator
CREATE OR REPLACE FUNCTION is_moderator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (is_moderator = true OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is suspended or banned
CREATE OR REPLACE FUNCTION is_user_suspended(user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_suspended boolean;
  is_banned boolean;
  suspension_end timestamptz;
BEGIN
  SELECT 
    p.is_suspended,
    p.is_banned,
    (
      SELECT MAX(end_date)
      FROM user_suspensions
      WHERE user_suspensions.user_id = p.id
    ) AS suspension_end
  INTO
    is_suspended,
    is_banned,
    suspension_end
  FROM profiles p
  WHERE p.id = user_id;
  
  -- If banned, always return true
  IF is_banned THEN
    RETURN true;
  END IF;
  
  -- If suspended and suspension hasn't ended, return true
  IF is_suspended AND (suspension_end IS NULL OR suspension_end > now()) THEN
    RETURN true;
  END IF;
  
  -- Otherwise, not suspended
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to promote user to moderator
CREATE OR REPLACE FUNCTION promote_to_moderator(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can promote users to moderators';
  END IF;
  
  -- Update the user's profile
  UPDATE profiles
  SET is_moderator = true
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to demote moderator
CREATE OR REPLACE FUNCTION demote_moderator(target_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can demote moderators';
  END IF;
  
  -- Update the user's profile
  UPDATE profiles
  SET is_moderator = false
  WHERE id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
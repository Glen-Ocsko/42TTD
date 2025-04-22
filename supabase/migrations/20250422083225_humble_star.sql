/*
  # Moderation System Tables

  1. New Tables
    - `moderation_actions` - Records all moderation actions taken
    - `user_suspensions` - Records user suspensions and bans
    - `moderation_messages` - Messages sent to users about moderation actions
  
  2. Security
    - Enable RLS on all tables
    - Add policies for moderators and users
    
  3. Changes
    - Add moderation-related fields to profiles table
*/

-- Create moderation_actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('warning', 'post_removal', 'suspension', 'ban', 'report_dismissed', 'report_resolved', 'escalated')),
  reason text NOT NULL,
  notes text,
  target_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid REFERENCES activity_posts(id) ON DELETE SET NULL,
  moderator_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_suspensions table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  is_permanent boolean DEFAULT false
);

-- Create moderation_messages table
CREATE TABLE IF NOT EXISTS moderation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action_id uuid REFERENCES moderation_actions(id) ON DELETE SET NULL,
  message_text text NOT NULL,
  is_system boolean DEFAULT false,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add moderation fields to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_moderator') THEN
    ALTER TABLE profiles ADD COLUMN is_moderator boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_suspended') THEN
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_banned') THEN
    ALTER TABLE profiles ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'suspension_end_date') THEN
    ALTER TABLE profiles ADD COLUMN suspension_end_date timestamptz;
  END IF;
END $$;

-- Create post_reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES activity_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  extra_notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reports ENABLE ROW LEVEL SECURITY;

-- Policies for moderation_actions
CREATE POLICY "Moderators can create moderation actions" 
  ON moderation_actions FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

CREATE POLICY "Moderators can view all moderation actions" 
  ON moderation_actions FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Policies for user_suspensions
CREATE POLICY "Moderators can create user suspensions" 
  ON user_suspensions FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

CREATE POLICY "Moderators can update user suspensions" 
  ON user_suspensions FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

CREATE POLICY "Moderators can view all user suspensions" 
  ON user_suspensions FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Policies for moderation_messages
CREATE POLICY "Moderators can create messages" 
  ON moderation_messages FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

CREATE POLICY "Moderators can view all messages" 
  ON moderation_messages FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

CREATE POLICY "Users can mark messages as read" 
  ON moderation_messages FOR UPDATE TO public
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id AND read = true);

CREATE POLICY "Users can view messages sent to them" 
  ON moderation_messages FOR SELECT TO public
  USING (auth.uid() = receiver_id);

-- Policies for post_reports
CREATE POLICY "Users can create reports" 
  ON post_reports FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderators can view all reports" 
  ON post_reports FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

CREATE POLICY "Moderators can update reports" 
  ON post_reports FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Create function to get user moderation messages
CREATE OR REPLACE FUNCTION get_user_moderation_messages(user_id uuid)
RETURNS TABLE (
  id uuid,
  receiver_id uuid,
  sender_id uuid,
  sender_username text,
  action_id uuid,
  action_type text,
  message_text text,
  is_system boolean,
  read boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mm.id,
    mm.receiver_id,
    mm.sender_id,
    p.username as sender_username,
    mm.action_id,
    ma.action_type,
    mm.message_text,
    mm.is_system,
    mm.read,
    mm.created_at
  FROM 
    moderation_messages mm
    LEFT JOIN profiles p ON mm.sender_id = p.id
    LEFT JOIN moderation_actions ma ON mm.action_id = ma.id
  WHERE 
    mm.receiver_id = user_id
  ORDER BY 
    mm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

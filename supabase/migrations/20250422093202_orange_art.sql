/*
  # Moderation Appeals System

  1. New Tables
    - `moderation_appeals` - Stores user appeals for moderation actions
  
  2. Changes
    - Add functions to check user suspension status
    - Add functions to handle appeals
    - Update existing moderation tables with new fields
*/

-- Create moderation_appeals table
CREATE TABLE IF NOT EXISTS moderation_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  related_action_id uuid REFERENCES moderation_actions(id) ON DELETE SET NULL,
  related_post_id uuid REFERENCES activity_posts(id) ON DELETE SET NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_response text,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE moderation_appeals ENABLE ROW LEVEL SECURITY;

-- Create policies for moderation_appeals
CREATE POLICY "Users can create their own appeals" 
  ON moderation_appeals FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own appeals" 
  ON moderation_appeals FOR SELECT TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view all appeals" 
  ON moderation_appeals FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

CREATE POLICY "Moderators can update appeals" 
  ON moderation_appeals FOR UPDATE TO public
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.is_moderator = true OR profiles.is_admin = true)
  ));

-- Create function to check if a user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(user_id uuid)
RETURNS boolean AS $$
DECLARE
  is_suspended boolean;
  suspension_end timestamptz;
  is_banned boolean;
BEGIN
  -- Get user suspension status
  SELECT 
    p.is_suspended, 
    p.suspension_end_date,
    p.is_banned
  INTO 
    is_suspended, 
    suspension_end,
    is_banned
  FROM 
    profiles p
  WHERE 
    p.id = user_id;
  
  -- If user is banned, they're definitely suspended
  IF is_banned THEN
    RETURN true;
  END IF;
  
  -- If user is suspended but suspension has expired, update their status
  IF is_suspended AND suspension_end IS NOT NULL AND suspension_end < now() THEN
    UPDATE profiles
    SET is_suspended = false, suspension_end_date = NULL
    WHERE id = user_id;
    
    RETURN false;
  END IF;
  
  -- Return current suspension status
  RETURN is_suspended;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user warnings
CREATE OR REPLACE FUNCTION get_user_warnings(user_id uuid)
RETURNS TABLE (
  id uuid,
  action_type text,
  reason text,
  created_at timestamptz,
  moderator_username text,
  post_id uuid,
  has_appeal boolean,
  appeal_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ma.id,
    ma.action_type,
    ma.reason,
    ma.created_at,
    p.username as moderator_username,
    ma.post_id,
    (EXISTS (
      SELECT 1 FROM moderation_appeals 
      WHERE related_action_id = ma.id
    )) as has_appeal,
    (SELECT status FROM moderation_appeals WHERE related_action_id = ma.id LIMIT 1) as appeal_status
  FROM 
    moderation_actions ma
    LEFT JOIN profiles p ON ma.moderator_id = p.id
  WHERE 
    ma.target_user_id = user_id
  ORDER BY 
    ma.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user suspension info
CREATE OR REPLACE FUNCTION get_user_suspension_info(user_id uuid)
RETURNS TABLE (
  id uuid,
  reason text,
  start_date timestamptz,
  end_date timestamptz,
  is_permanent boolean,
  created_at timestamptz,
  moderator_username text,
  days_remaining integer,
  has_appeal boolean,
  appeal_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.reason,
    us.start_date,
    us.end_date,
    us.is_permanent,
    us.created_at,
    p.username as moderator_username,
    CASE 
      WHEN us.end_date IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (us.end_date - now()))::integer
    END as days_remaining,
    (EXISTS (
      SELECT 1 FROM moderation_appeals ma
      JOIN moderation_actions act ON ma.related_action_id = act.id
      WHERE act.target_user_id = user_id AND act.action_type IN ('suspension', 'ban')
    )) as has_appeal,
    (SELECT ma.status FROM moderation_appeals ma
     JOIN moderation_actions act ON ma.related_action_id = act.id
     WHERE act.target_user_id = user_id AND act.action_type IN ('suspension', 'ban')
     ORDER BY ma.created_at DESC LIMIT 1) as appeal_status
  FROM 
    user_suspensions us
    LEFT JOIN profiles p ON us.created_by = p.id
  WHERE 
    us.user_id = user_id
  ORDER BY 
    us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle appeal approval
CREATE OR REPLACE FUNCTION approve_moderation_appeal(appeal_id uuid, moderator_id uuid, response text)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
  v_action_id uuid;
  v_action_type text;
BEGIN
  -- Get appeal details
  SELECT 
    a.user_id, 
    a.related_action_id,
    ma.action_type
  INTO 
    v_user_id, 
    v_action_id,
    v_action_type
  FROM 
    moderation_appeals a
    JOIN moderation_actions ma ON a.related_action_id = ma.id
  WHERE 
    a.id = appeal_id;
  
  -- Update appeal status
  UPDATE moderation_appeals
  SET 
    status = 'approved',
    moderator_response = response,
    reviewed_by = moderator_id,
    reviewed_at = now()
  WHERE 
    id = appeal_id;
  
  -- If suspension or ban, remove it
  IF v_action_type = 'suspension' OR v_action_type = 'ban' THEN
    UPDATE profiles
    SET 
      is_suspended = false,
      is_banned = CASE WHEN v_action_type = 'ban' THEN false ELSE is_banned END,
      suspension_end_date = NULL
    WHERE 
      id = v_user_id;
  END IF;
  
  -- Send notification to user
  INSERT INTO moderation_messages (
    receiver_id,
    sender_id,
    message_text,
    is_system
  ) VALUES (
    v_user_id,
    moderator_id,
    'Your appeal has been approved: ' || response,
    false
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle appeal rejection
CREATE OR REPLACE FUNCTION reject_moderation_appeal(appeal_id uuid, moderator_id uuid, response text)
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID
  SELECT user_id INTO v_user_id
  FROM moderation_appeals
  WHERE id = appeal_id;
  
  -- Update appeal status
  UPDATE moderation_appeals
  SET 
    status = 'rejected',
    moderator_response = response,
    reviewed_by = moderator_id,
    reviewed_at = now()
  WHERE 
    id = appeal_id;
  
  -- Send notification to user
  INSERT INTO moderation_messages (
    receiver_id,
    sender_id,
    message_text,
    is_system
  ) VALUES (
    v_user_id,
    moderator_id,
    'Your appeal has been rejected: ' || response,
    false
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add from_moderator field to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'from_moderator') THEN
    ALTER TABLE messages ADD COLUMN from_moderator boolean DEFAULT false;
  END IF;
END $$;
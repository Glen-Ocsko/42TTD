/*
  # Add Moderation Messages System

  1. New Tables
    - `moderation_messages`
      - Stores messages from moderators to users
      - Links to moderation actions
      - Supports system-generated and moderator-written messages
      - Tracks read status

  2. Security
    - Enable RLS
    - Add policies for appropriate access control
    - Add function to send moderation messages
*/

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

-- Enable RLS
ALTER TABLE moderation_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages sent to them"
  ON moderation_messages
  FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Moderators can view all messages"
  ON moderation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_moderator = true OR profiles.is_admin = true)
    )
  );

CREATE POLICY "Moderators can create messages"
  ON moderation_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.is_moderator = true OR profiles.is_admin = true)
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON moderation_messages
  FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id AND
    (
      -- Only allow updating the read status
      (OLD.read = false AND NEW.read = true) AND
      -- Ensure other fields remain unchanged
      OLD.receiver_id = NEW.receiver_id AND
      OLD.sender_id = NEW.sender_id AND
      OLD.action_id = NEW.action_id AND
      OLD.message_text = NEW.message_text AND
      OLD.is_system = NEW.is_system AND
      OLD.created_at = NEW.created_at
    )
  );

-- Create function to send moderation message
CREATE OR REPLACE FUNCTION send_moderation_message(
  receiver_id uuid,
  message_text text,
  action_id uuid DEFAULT NULL,
  is_system boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id uuid;
  sender_id uuid;
BEGIN
  -- Set sender_id to the current user if not a system message
  IF NOT is_system THEN
    sender_id := auth.uid();
    
    -- Check if sender is a moderator or admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = sender_id
      AND (is_moderator = true OR is_admin = true)
    ) THEN
      RAISE EXCEPTION 'Only moderators and admins can send moderation messages';
    END IF;
  END IF;
  
  -- Insert the message
  INSERT INTO moderation_messages (
    receiver_id,
    sender_id,
    action_id,
    message_text,
    is_system,
    read,
    created_at
  )
  VALUES (
    receiver_id,
    sender_id,
    action_id,
    message_text,
    is_system,
    false,
    now()
  )
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$;

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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mm.id,
    mm.receiver_id,
    mm.sender_id,
    p.username AS sender_username,
    mm.action_id,
    ma.action_type,
    mm.message_text,
    mm.is_system,
    mm.read,
    mm.created_at
  FROM moderation_messages mm
  LEFT JOIN profiles p ON mm.sender_id = p.id
  LEFT JOIN moderation_actions ma ON mm.action_id = ma.id
  WHERE mm.receiver_id = user_id
  ORDER BY mm.created_at DESC;
END;
$$;
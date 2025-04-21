/*
  # Create Messages System

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references auth.users)
      - `receiver_id` (uuid, references auth.users)
      - `ad_id` (uuid, nullable, references supplier_ads)
      - `activity_id` (uuid, nullable, references activities)
      - `message_text` (text)
      - `timestamp` (timestamptz, default now())
      - `read` (boolean, default false)
      - `conversation_id` (text, generated from sender and receiver IDs)

  2. Security
    - Enable RLS
    - Add policies for:
      - Users can only view messages they sent or received
      - Users can only create messages they send
*/

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES supplier_ads(id) ON DELETE SET NULL,
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  message_text text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  conversation_id text GENERATED ALWAYS AS (
    CASE 
      WHEN sender_id < receiver_id THEN sender_id::text || '-' || receiver_id::text
      ELSE receiver_id::text || '-' || sender_id::text
    END
  ) STORED
);

-- Create index on conversation_id for faster lookups
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Create index on sender_id and receiver_id
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);

-- Create index on timestamp for sorting
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received (for read status)"
  ON messages
  FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Create function to get conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_id uuid)
RETURNS TABLE (
  conversation_id text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message text,
  last_message_time timestamptz,
  unread_count bigint,
  ad_id uuid,
  activity_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (m.conversation_id)
      m.conversation_id,
      m.sender_id,
      m.receiver_id,
      m.message_text,
      m.timestamp,
      m.ad_id,
      m.activity_id
    FROM messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ORDER BY m.conversation_id, m.timestamp DESC
  ),
  unread_counts AS (
    SELECT 
      conversation_id,
      COUNT(*) as count
    FROM messages
    WHERE receiver_id = user_id AND read = false
    GROUP BY conversation_id
  )
  SELECT
    lm.conversation_id,
    CASE 
      WHEN lm.sender_id = user_id THEN lm.receiver_id
      ELSE lm.sender_id
    END as other_user_id,
    COALESCE(p.username, p.full_name, 'Unknown User') as other_user_name,
    p.avatar_url as other_user_avatar,
    lm.message_text as last_message,
    lm.timestamp as last_message_time,
    COALESCE(uc.count, 0) as unread_count,
    lm.ad_id,
    lm.activity_id
  FROM latest_messages lm
  LEFT JOIN profiles p ON (
    CASE 
      WHEN lm.sender_id = user_id THEN lm.receiver_id
      ELSE lm.sender_id
    END = p.id
  )
  LEFT JOIN unread_counts uc ON lm.conversation_id = uc.conversation_id
  ORDER BY lm.timestamp DESC;
END;
$$;
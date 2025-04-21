/*
  # Create Messages System and Fix get_user_conversations Function

  1. New Tables
    - `messages`
      - For direct messaging between users
      - Includes references to ads and activities
      - Uses generated conversation_id for grouping

  2. Functions
    - Drop and recreate get_user_conversations with proper return type
    
  3. Security
    - Enable RLS
    - Add policies for appropriate access control
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can view their own messages'
  ) THEN
    CREATE POLICY "Users can view their own messages"
      ON messages
      FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can send messages'
  ) THEN
    CREATE POLICY "Users can send messages"
      ON messages
      FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can update messages they received (for read status)'
  ) THEN
    CREATE POLICY "Users can update messages they received (for read status)"
      ON messages
      FOR UPDATE
      USING (auth.uid() = receiver_id);
  END IF;
END $$;

-- Drop the existing function first to avoid return type errors
DROP FUNCTION IF EXISTS get_user_conversations(uuid);

-- Create function to get conversations for a user
CREATE FUNCTION get_user_conversations(p_user_id uuid)
RETURNS TABLE (
  id text,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message text,
  last_message_time timestamptz,
  unread_count bigint,
  ad_id uuid,
  ad_title text,
  activity_id uuid,
  activity_title text
)
LANGUAGE plpgsql
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
    WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    ORDER BY m.conversation_id, m.timestamp DESC
  ),
  unread_counts AS (
    SELECT
      conversation_id,
      COUNT(*) AS count
    FROM messages
    WHERE receiver_id = p_user_id AND read = false
    GROUP BY conversation_id
  )
  SELECT
    lm.conversation_id AS id,
    CASE
      WHEN lm.sender_id = p_user_id THEN lm.receiver_id
      ELSE lm.sender_id
    END AS other_user_id,
    p.username AS other_user_name,
    p.avatar_url AS other_user_avatar,
    lm.message_text AS last_message,
    lm.timestamp AS last_message_time,
    COALESCE(uc.count, 0) AS unread_count,
    lm.ad_id,
    sa.title AS ad_title,
    lm.activity_id,
    a.title AS activity_title
  FROM latest_messages lm
  LEFT JOIN profiles p ON p.id = 
    CASE
      WHEN lm.sender_id = p_user_id THEN lm.receiver_id
      ELSE lm.sender_id
    END
  LEFT JOIN unread_counts uc ON uc.conversation_id = lm.conversation_id
  LEFT JOIN supplier_ads sa ON sa.id = lm.ad_id
  LEFT JOIN activities a ON a.id = lm.activity_id
  ORDER BY lm.timestamp DESC;
END;
$$;
/*
  # Add Moderator Messaging Functionality

  1. New Tables
    - None (using existing moderation_messages table)
  
  2. Changes
    - Add from_moderator field to messages table
    - Add policies to allow moderators to send special messages
    - Add function to get conversations with moderator messages
  
  3. Security
    - Enable RLS on messages table
    - Add policies to control who can send moderator messages
*/

-- Add from_moderator field to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'from_moderator') THEN
    ALTER TABLE messages ADD COLUMN from_moderator boolean DEFAULT false;
  END IF;
END $$;

-- Create policy for moderators to send messages to any user
DO $$
BEGIN
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
END $$;


-- Create function to get conversations including moderator messages
CREATE OR REPLACE FUNCTION get_user_conversations_with_moderator(p_user_id uuid)
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
  activity_title text,
  is_moderator_conversation boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    -- Regular conversations
    SELECT 
      CASE 
        WHEN sender_id < receiver_id THEN sender_id || '-' || receiver_id
        ELSE receiver_id || '-' || sender_id
      END AS conversation_id,
      CASE 
        WHEN sender_id = p_user_id THEN receiver_id
        ELSE sender_id
      END AS other_user_id,
      MAX(timestamp) as last_message_time,
      COUNT(*) FILTER (WHERE receiver_id = p_user_id AND read = false) as unread_count,
      FIRST_VALUE(ad_id) OVER (PARTITION BY 
        CASE 
          WHEN sender_id < receiver_id THEN sender_id || '-' || receiver_id
          ELSE receiver_id || '-' || sender_id
        END 
        ORDER BY timestamp DESC) as ad_id,
      FIRST_VALUE(activity_id) OVER (PARTITION BY 
        CASE 
          WHEN sender_id < receiver_id THEN sender_id || '-' || receiver_id
          ELSE receiver_id || '-' || sender_id
        END 
        ORDER BY timestamp DESC) as activity_id,
      FIRST_VALUE(message_text) OVER (PARTITION BY 
        CASE 
          WHEN sender_id < receiver_id THEN sender_id || '-' || receiver_id
          ELSE receiver_id || '-' || sender_id
        END 
        ORDER BY timestamp DESC) as last_message,
      FIRST_VALUE(from_moderator) OVER (PARTITION BY 
        CASE 
          WHEN sender_id < receiver_id THEN sender_id || '-' || receiver_id
          ELSE receiver_id || '-' || sender_id
        END 
        ORDER BY timestamp DESC) as is_moderator_message
    FROM messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
    GROUP BY conversation_id, other_user_id, ad_id, activity_id, message_text, from_moderator
  )
  SELECT 
    c.conversation_id as id,
    c.other_user_id,
    p.username as other_user_name,
    p.avatar_url as other_user_avatar,
    c.last_message,
    c.last_message_time,
    c.unread_count,
    c.ad_id,
    sa.title as ad_title,
    c.activity_id,
    a.title as activity_title,
    c.is_moderator_message as is_moderator_conversation
  FROM conversations c
  LEFT JOIN profiles p ON c.other_user_id = p.id
  LEFT JOIN supplier_ads sa ON c.ad_id = sa.id
  LEFT JOIN activities a ON c.activity_id = a.id
  ORDER BY c.last_message_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
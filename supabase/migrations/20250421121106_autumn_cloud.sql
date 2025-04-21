/*
  # Fix get_user_conversations function

  1. Changes
    - Drop existing function to avoid conflicts
    - Recreate function with proper column qualification
    - Fix ambiguous column reference for conversation_id
    - Ensure proper table joins and aliases

  2. Security
    - Maintain existing security settings
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_conversations(uuid);

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id uuid)
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
      m.conversation_id,
      COUNT(*) AS count
    FROM messages m
    WHERE m.receiver_id = p_user_id AND m.read = false
    GROUP BY m.conversation_id
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
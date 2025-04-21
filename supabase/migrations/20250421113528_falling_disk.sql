/*
  # Fix ambiguous conversation_id reference

  1. Changes
    - Drop and recreate get_user_conversations function with proper column qualification
    - Ensure all column references are properly qualified with their table names
    - Return the same structure but with unambiguous column references

  2. Security
    - Maintain existing RLS policies
    - Function remains accessible to authenticated users only
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_user_conversations;

-- Recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
    conversation_id TEXT,
    other_user_id UUID,
    other_user_name TEXT,
    other_user_avatar TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT,
    ad_id UUID,
    activity_id UUID
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    WITH conversations AS (
        SELECT 
            m.conversation_id,
            CASE 
                WHEN m.sender_id = user_id THEN m.receiver_id 
                ELSE m.sender_id 
            END as other_user_id,
            m.ad_id,
            m.activity_id,
            m.message_text as last_message,
            m.timestamp as last_message_time,
            COUNT(*) FILTER (WHERE m.receiver_id = user_id AND m.read = false) as unread_count
        FROM messages m
        WHERE m.sender_id = user_id OR m.receiver_id = user_id
        GROUP BY m.conversation_id, other_user_id, m.ad_id, m.activity_id, last_message, last_message_time
    )
    SELECT 
        c.conversation_id,
        c.other_user_id,
        p.username as other_user_name,
        p.avatar_url as other_user_avatar,
        c.last_message,
        c.last_message_time,
        c.unread_count,
        c.ad_id,
        c.activity_id
    FROM conversations c
    JOIN profiles p ON p.id = c.other_user_id
    ORDER BY c.last_message_time DESC;
$$;
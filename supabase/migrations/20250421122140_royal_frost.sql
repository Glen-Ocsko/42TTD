/*
  # Fix get_user_conversations function with CASCADE

  1. Changes
    - Drop existing function with CASCADE to remove dependencies
    - Recreate function with new return type structure
    - Fix column references and table joins
    - Ensure proper parameter naming

  2. Security
    - Maintain existing security settings
*/

-- Drop the existing function with CASCADE to remove dependencies
DROP FUNCTION IF EXISTS get_user_conversations(uuid) CASCADE;

-- Create the new function with updated return type
CREATE OR REPLACE FUNCTION get_user_conversations(user_id uuid)
RETURNS TABLE (
    conversation_id uuid,
    participant_id uuid,
    last_message text,
    updated_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS conversation_id,
        cp.participant_id,
        m.message_text AS last_message,
        c.updated_at
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    LEFT JOIN messages m ON m.id = c.last_message_id
    WHERE cp.participant_id = user_id;
END;
$$ LANGUAGE plpgsql;
/*
  # Fix activity stats function

  1. Changes
    - Fix ambiguous column reference in get_activity_stats function
    - Add proper table qualification for activity_id
    
  2. New Functions
    - Recreate get_activity_stats with proper column references
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_activity_stats;

-- Recreate function with proper column references
CREATE OR REPLACE FUNCTION get_activity_stats(activity_id uuid)
RETURNS TABLE (
  total_users bigint,
  in_progress bigint,
  completed bigint,
  avg_difficulty numeric,
  avg_cost numeric,
  avg_enjoyment numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ua.user_id) as total_users,
    COUNT(DISTINCT CASE WHEN ua.status = 'in_progress' THEN ua.user_id END) as in_progress,
    COUNT(DISTINCT CASE WHEN ua.status = 'completed' THEN ua.user_id END) as completed,
    COALESCE(AVG(ua.rating_difficulty), 0) as avg_difficulty,
    COALESCE(AVG(ua.rating_cost), 0) as avg_cost,
    COALESCE(AVG(ua.rating_enjoyment), 0) as avg_enjoyment
  FROM user_activities ua
  WHERE ua.activity_id = $1;
END;
$$;
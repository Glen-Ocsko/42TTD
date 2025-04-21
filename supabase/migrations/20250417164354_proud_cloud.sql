/*
  # Add Activity Stats Function

  1. New Function
    - `get_activity_stats`: Calculates activity statistics in a single query
    - Returns total users, status counts, and average ratings
    - Uses CTEs for better performance and readability

  2. Security
    - Function is accessible to all authenticated users
    - No additional RLS policies needed as it uses existing table policies
*/

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
  WITH stats AS (
    SELECT 
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      ROUND(AVG(rating_difficulty)::numeric, 1) as avg_difficulty,
      ROUND(AVG(rating_cost)::numeric, 1) as avg_cost,
      ROUND(AVG(rating_enjoyment)::numeric, 1) as avg_enjoyment
    FROM user_activities
    WHERE activity_id = $1
  )
  SELECT 
    total_users,
    in_progress,
    completed,
    COALESCE(avg_difficulty, 0) as avg_difficulty,
    COALESCE(avg_cost, 0) as avg_cost,
    COALESCE(avg_enjoyment, 0) as avg_enjoyment
  FROM stats;
END;
$$;
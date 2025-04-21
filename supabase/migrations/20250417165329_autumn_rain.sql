/*
  # Add role toggle function

  1. New Functions
    - `toggle_user_role`: Allows updating user role for testing
    - Accepts user_id and new_role parameters
    - Updates user_roles table
    
  2. Security
    - Function is accessible to all authenticated users (for testing only)
    - In production, this would be restricted to admin users
*/

CREATE OR REPLACE FUNCTION toggle_user_role(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('free', 'premium', 'pro') THEN
    RAISE EXCEPTION 'Invalid role. Must be free, premium, or pro';
  END IF;

  -- Insert or update role
  INSERT INTO user_roles (user_id, role, upgraded_at)
  VALUES (user_id, new_role, now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    upgraded_at = EXCLUDED.upgraded_at;
END;
$$;
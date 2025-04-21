/*
  # Create Demo Account with Full Profile

  1. Changes
    - Thorough cleanup of existing demo user data
    - Transaction for consistency
    - Fixed UUID for demo user
    - Proper order of operations

  2. Security
    - Maintain existing RLS policies
    - Clean removal of existing data
*/

BEGIN;

-- First, clean up any existing demo user data from all tables
DO $$
DECLARE
  existing_user_id uuid;
BEGIN
  -- Get the ID of any existing demo user
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'demo@example.com';
  
  IF existing_user_id IS NOT NULL THEN
    -- Delete from all related tables in correct order
    DELETE FROM user_activities WHERE user_id = existing_user_id;
    DELETE FROM user_quiz_scores WHERE user_id = existing_user_id;
    DELETE FROM user_roles WHERE user_id = existing_user_id;
    DELETE FROM profiles WHERE id = existing_user_id;
    DELETE FROM auth.users WHERE id = existing_user_id;
  END IF;
END $$;

-- Now create the new demo user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '12345678-1234-1234-1234-123456789012',
  'authenticated',
  'authenticated',
  'demo@example.com',
  crypt('demo123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{}',
  false
);

-- Create profile
INSERT INTO profiles (
  id,
  username,
  full_name,
  email,
  avatar_url,
  location,
  age,
  gender,
  interests,
  health_considerations,
  onboarding_completed,
  quiz_completed,
  notification_preferences,
  privacy_default,
  created_at,
  updated_at
)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'demo_user',
  'Demo User',
  'demo@example.com',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  'San Francisco, CA',
  28,
  'prefer_not_to_say',
  '["Adventure", "Travel", "Photography", "Fitness", "Learning"]',
  '["none"]',
  true,
  true,
  '{"push": true, "email": true}',
  'public',
  now(),
  now()
);

-- Set initial role
INSERT INTO user_roles (
  user_id,
  role,
  upgraded_at
)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'free',
  now()
);

-- Add quiz scores
INSERT INTO user_quiz_scores (
  user_id,
  risk_tolerance,
  adventure,
  creativity,
  sociability,
  travel,
  budget,
  time,
  accessibility
)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  7,
  85,
  70,
  75,
  90,
  65,
  80,
  95
);

-- Add some sample activities
INSERT INTO user_activities (
  user_id,
  activity_id,
  status,
  progress,
  privacy,
  rating_difficulty,
  rating_cost,
  rating_enjoyment
)
SELECT
  '12345678-1234-1234-1234-123456789012',
  id,
  (CASE floor(random() * 3)
    WHEN 0 THEN 'not_started'
    WHEN 1 THEN 'in_progress'
    ELSE 'completed'
  END)::text,
  CASE WHEN random() < 0.5 THEN floor(random() * 100) ELSE 100 END,
  'public',
  floor(random() * 5) + 1,
  floor(random() * 5) + 1,
  floor(random() * 5) + 1
FROM activities
LIMIT 10;

COMMIT;
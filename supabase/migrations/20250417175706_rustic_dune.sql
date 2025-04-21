/*
  # Create Demo Account

  1. Creates a demo user account with:
    - Email: demo@example.com
    - Password: demo123456
  2. Sets up profile and role with required fields
  3. Adds sample quiz scores and activities
*/

DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- First, delete any existing data for the demo user in the correct order
  -- to respect foreign key constraints
  DELETE FROM public.user_activities
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'demo@example.com'
  );

  DELETE FROM public.user_quiz_scores
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'demo@example.com'
  );

  DELETE FROM public.user_roles
  WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'demo@example.com'
  );

  DELETE FROM public.profiles
  WHERE email = 'demo@example.com';

  DELETE FROM auth.users
  WHERE email = 'demo@example.com';

  -- Insert demo user into auth.users
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
    gen_random_uuid(),
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
  )
  RETURNING id INTO demo_user_id;

  -- Create profile for demo user
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    avatar_url,
    onboarding_completed,
    quiz_completed,
    health_considerations,
    location,
    age,
    gender,
    interests,
    created_at,
    updated_at,
    notification_preferences,
    privacy_default
  )
  VALUES (
    demo_user_id,
    'demo_user',
    'Demo User',
    'demo@example.com',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    true,
    true,
    '["none"]',
    'San Francisco, CA',
    25,
    'prefer_not_to_say',
    '["Adventure", "Travel", "Photography"]',
    now(),
    now(),
    '{"push": true, "email": true}',
    'public'
  );

  -- Set demo user role to premium
  INSERT INTO public.user_roles (user_id, role)
  VALUES (demo_user_id, 'premium');

  -- Add sample quiz scores
  INSERT INTO public.user_quiz_scores (
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
    demo_user_id,
    7,
    80,
    65,
    70,
    85,
    60,
    75,
    90
  );

  -- Add some sample activities
  INSERT INTO public.user_activities (
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
    demo_user_id,
    id,
    CASE floor(random() * 3)::integer
      WHEN 0 THEN 'not_started'
      WHEN 1 THEN 'in_progress'
      ELSE 'completed'
    END,
    CASE WHEN random() < 0.5 THEN floor(random() * 100) ELSE 100 END,
    'public',
    floor(random() * 5) + 1,
    floor(random() * 5) + 1,
    floor(random() * 5) + 1
  FROM public.activities
  LIMIT 10;

END;
$$;
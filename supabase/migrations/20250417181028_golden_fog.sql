-- First, clean up any existing demo user data in the correct order
DO $$
DECLARE
  demo_id uuid := '00000000-0000-0000-0000-000000000000';
  existing_user_id uuid;
BEGIN
  -- Get the ID of any existing demo user
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'demo@example.com';
  
  IF existing_user_id IS NOT NULL THEN
    -- Delete from all related tables in correct order to respect foreign keys
    DELETE FROM user_activities WHERE user_id = existing_user_id;
    DELETE FROM user_quiz_scores WHERE user_id = existing_user_id;
    DELETE FROM user_roles WHERE user_id = existing_user_id;
    DELETE FROM profiles WHERE id = existing_user_id;
    DELETE FROM auth.users WHERE id = existing_user_id;
  END IF;

  -- Create demo user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    demo_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@example.com',
    crypt('demo123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Demo User"}',
    false
  );

  -- Create demo profile
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
    notification_preferences,
    privacy_default,
    created_at,
    updated_at
  ) VALUES (
    demo_id,
    'demo_user',
    'Demo User',
    'demo@example.com',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    true,
    true,
    '["none"]',
    'San Francisco, CA',
    28,
    'prefer_not_to_say',
    '["Adventure", "Travel", "Photography", "Fitness", "Learning"]',
    '{"push": true, "email": true}',
    'public',
    now(),
    now()
  );

  -- Set initial role
  INSERT INTO public.user_roles (user_id, role, upgraded_at)
  VALUES (demo_id, 'free', now());

  -- Add quiz scores
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
  ) VALUES (
    demo_id,
    7,
    80,
    70,
    75,
    85,
    60,
    70,
    90
  );

  -- Add sample activities
  INSERT INTO public.user_activities (
    user_id,
    activity_id,
    status,
    progress,
    privacy
  )
  SELECT
    demo_id,
    id,
    'not_started',
    0,
    'public'
  FROM public.activities
  LIMIT 5;

END $$;

-- Update RLS policies to allow role updates
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
CREATE POLICY "Users can update their own role"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
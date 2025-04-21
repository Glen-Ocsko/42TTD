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
    DELETE FROM bookmarks WHERE user_id = existing_user_id;
    DELETE FROM reactions WHERE user_id = existing_user_id;
    DELETE FROM comments WHERE user_id = existing_user_id;
    DELETE FROM social_posts WHERE user_id = existing_user_id;
    DELETE FROM mentions WHERE user_id = existing_user_id OR mentioned_user_id = existing_user_id;
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
    is_super_admin,
    confirmation_token,
    recovery_token
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
    false,
    '',
    ''
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

  -- Add sample activities with varied statuses
  INSERT INTO public.user_activities (
    user_id,
    activity_id,
    status,
    progress,
    privacy,
    rating_difficulty,
    rating_cost,
    rating_enjoyment,
    created_at
  )
  SELECT
    demo_id,
    id,
    CASE floor(random() * 3)
      WHEN 0 THEN 'not_started'
      WHEN 1 THEN 'in_progress'
      ELSE 'completed'
    END,
    CASE 
      WHEN random() < 0.3 THEN 0
      WHEN random() < 0.6 THEN floor(random() * 99) + 1
      ELSE 100
    END,
    'public',
    floor(random() * 5) + 1,
    floor(random() * 5) + 1,
    floor(random() * 5) + 1,
    now() - (floor(random() * 30) || ' days')::interval
  FROM public.activities
  ORDER BY random()
  LIMIT 10;

  -- Add some social posts
  INSERT INTO public.social_posts (
    user_id,
    activity_id,
    content,
    status,
    visibility,
    created_at
  )
  SELECT
    demo_id,
    id,
    'Made great progress on this activity! #excited #adventure',
    'published',
    'public',
    now() - (floor(random() * 10) || ' days')::interval
  FROM public.activities
  WHERE id IN (
    SELECT activity_id 
    FROM public.user_activities 
    WHERE user_id = demo_id 
    AND status = 'completed'
  )
  LIMIT 3;

END $$;

-- Update RLS policies to allow role updates
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
CREATE POLICY "Users can update their own role"
  ON public.user_roles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add policy for inserting roles
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add policy for viewing roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);
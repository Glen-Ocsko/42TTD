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
  -- Create demo user if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'demo@example.com'
  ) THEN
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
      updated_at
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
      now()
    )
    RETURNING id INTO demo_user_id;

    -- Create profile for demo user with required health_considerations
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      email,
      onboarding_completed,
      quiz_completed,
      health_considerations,
      created_at,
      updated_at
    )
    VALUES (
      demo_user_id,
      'demo_user',
      'Demo User',
      'demo@example.com',
      true,
      true,
      '["none"]',
      now(),
      now()
    );

    -- Set demo user role
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
      privacy
    )
    SELECT
      demo_user_id,
      id,
      'in_progress',
      FLOOR(RANDOM() * 100),
      'public'
    FROM public.activities
    LIMIT 5;
  END IF;
END;
$$;
-- Create demo user if it doesn't exist
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Check if demo user exists
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@example.com';

  -- Only create new user if it doesn't exist
  IF demo_user_id IS NULL THEN
    -- Insert demo user into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
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
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO demo_user_id;

    -- Create profile for demo user
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      email,
      created_at,
      updated_at,
      privacy_default,
      onboarding_completed,
      quiz_completed,
      health_considerations
    )
    VALUES (
      demo_user_id,
      'demo_user',
      'Demo User',
      'demo@example.com',
      now(),
      now(),
      'private',
      true,
      true,
      '["none"]'
    );

    -- Set user role
    INSERT INTO public.user_roles (user_id, role, upgraded_at)
    VALUES (demo_user_id, 'free', now());

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
    )
    VALUES (
      demo_user_id,
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
      demo_user_id,
      id,
      'not_started',
      0,
      'public'
    FROM public.activities
    LIMIT 5;
  END IF;
END $$;
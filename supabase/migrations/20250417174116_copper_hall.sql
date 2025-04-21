/*
  # Update demo user profile with avatar

  1. Changes
    - Add avatar URL for demo user
    - Update profile fields for better demo experience

  2. Security
    - No security changes needed
    - Uses existing RLS policies
*/

UPDATE profiles
SET 
  avatar_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  full_name = 'Demo User',
  username = 'demo_user',
  location = 'San Francisco, CA',
  gender = 'prefer_not_to_say',
  interests = '["Adventure", "Travel", "Photography"]'::jsonb,
  health_considerations = '["none"]'::jsonb,
  notification_preferences = '{"push": true, "email": true}'::jsonb,
  privacy_default = 'public',
  onboarding_completed = true,
  quiz_completed = true
WHERE 
  email = 'demo@example.com';
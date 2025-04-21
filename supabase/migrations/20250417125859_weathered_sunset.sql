/*
  # Initial Schema Setup for 42 Things To Do

  1. New Tables
    - `profiles`
      - Stores user profile information
      - Links to auth.users
      - Includes privacy settings and preferences
    
    - `friendships`
      - Manages user relationships
      - Includes status (pending, accepted)
    
    - `activity_categories`
      - Stores predefined activity categories
      - Used for organizing and filtering activities
    
    - `activities`
      - Stores the base activity definitions
      - Includes difficulty, category, and description
    
    - `user_activities`
      - Links users to their selected activities
      - Tracks progress and completion status
      - Includes privacy settings
    
    - `activity_media`
      - Stores proof of completion (photos/videos)
      - Links to user_activities
      - Includes moderation status

  2. Security
    - Enable RLS on all tables
    - Add policies for appropriate access control
    - Ensure user data privacy
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notification_preferences jsonb DEFAULT '{"email": true, "push": true}'::jsonb,
  privacy_default text DEFAULT 'private' CHECK (privacy_default IN ('public', 'friends', 'private'))
);

-- Create friendships table
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create activity categories table
CREATE TABLE activity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES activity_categories(id),
  difficulty integer CHECK (difficulty BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user activities table
CREATE TABLE user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress integer DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  privacy text DEFAULT 'private' CHECK (privacy IN ('public', 'friends', 'private')),
  target_date date,
  priority integer CHECK (priority BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

-- Create activity media table
CREATE TABLE activity_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_activity_id uuid REFERENCES user_activities(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text CHECK (media_type IN ('image', 'video')),
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_media ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() IN (user_id, friend_id));

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendship status"
  ON friendships FOR UPDATE
  USING (auth.uid() IN (user_id, friend_id));

-- Activities policies
CREATE POLICY "Anyone can view activities"
  ON activities FOR SELECT
  USING (true);

-- User activities policies
CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (
    auth.uid() = user_id
    OR privacy = 'public'
    OR (
      privacy = 'friends'
      AND EXISTS (
        SELECT 1 FROM friendships
        WHERE (user_id = auth.uid() OR friend_id = auth.uid())
        AND status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can create their own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON user_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Activity media policies
CREATE POLICY "Users can view approved media or their own"
  ON activity_media FOR SELECT
  USING (
    moderation_status = 'approved'
    OR EXISTS (
      SELECT 1 FROM user_activities
      WHERE id = activity_media.user_activity_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload media for their activities"
  ON activity_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_activities
      WHERE id = user_activity_id
      AND user_id = auth.uid()
    )
  );
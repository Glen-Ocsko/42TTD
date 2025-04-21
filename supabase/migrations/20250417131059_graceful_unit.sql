/*
  # Activities System Setup

  1. New Tables
    - `activities`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text, optional)
      - `category_id` (uuid, references activity_categories)
      - `difficulty` (integer, 1-5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `activity_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `created_at` (timestamp)

    - `user_activities`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `activity_id` (uuid, references activities)
      - `status` (text: not_started, in_progress, completed)
      - `progress` (integer, 0-100)
      - `privacy` (text: public, friends, private)
      - `target_date` (date, optional)
      - `priority` (integer, 1-5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `activity_media`
      - `id` (uuid, primary key)
      - `user_activity_id` (uuid, references user_activities)
      - `media_url` (text)
      - `media_type` (text: image, video)
      - `moderation_status` (text: pending, approved, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create activity_categories table
CREATE TABLE IF NOT EXISTS activity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$ 
BEGIN
  CREATE POLICY "Categories are viewable by everyone"
    ON activity_categories
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category_id uuid REFERENCES activity_categories(id),
  difficulty integer CHECK (difficulty >= 1 AND difficulty <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$ 
BEGIN
  CREATE POLICY "Anyone can view activities"
    ON activities
    FOR SELECT
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  privacy text DEFAULT 'private' CHECK (privacy IN ('public', 'friends', 'private')),
  target_date date,
  priority integer CHECK (priority >= 1 AND priority <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  CREATE POLICY "Users can view their own activities"
    ON user_activities
    FOR SELECT
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
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can create their own activities"
    ON user_activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can update their own activities"
    ON user_activities
    FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create activity_media table
CREATE TABLE IF NOT EXISTS activity_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_activity_id uuid REFERENCES user_activities(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text CHECK (media_type IN ('image', 'video')),
  moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_media ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  CREATE POLICY "Users can upload media for their activities"
    ON activity_media
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_activities
        WHERE user_activities.id = activity_media.user_activity_id
        AND user_activities.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Users can view approved media or their own"
    ON activity_media
    FOR SELECT
    USING (
      moderation_status = 'approved'
      OR EXISTS (
        SELECT 1 FROM user_activities
        WHERE user_activities.id = activity_media.user_activity_id
        AND user_activities.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
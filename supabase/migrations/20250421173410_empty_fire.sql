/*
  # Create User Following System

  1. New Tables
    - `follows`
      - Stores user follow relationships
      - Includes status for follow requests
      - Supports privacy levels

  2. Security
    - Enable RLS
    - Add policies for appropriate access control
*/

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own follows"
  ON follows
  FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can create follow requests"
  ON follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update follow status for requests they receive"
  ON follows
  FOR UPDATE
  USING (auth.uid() = following_id)
  WITH CHECK (auth.uid() = following_id);

CREATE POLICY "Users can delete their own follows"
  ON follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Add profile_bio column to profiles if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_bio text;

-- Add privacy_default column to profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'privacy_default'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_default text DEFAULT 'public' CHECK (privacy_default IN ('public', 'friends', 'private'));
  END IF;
END $$;

-- Create function to check if a user can view another user's profile
CREATE OR REPLACE FUNCTION can_view_profile(viewer_id uuid, profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  privacy text;
  is_following boolean;
BEGIN
  -- Get the profile's privacy setting
  SELECT privacy_default INTO privacy
  FROM profiles
  WHERE id = profile_id;
  
  -- If public, anyone can view
  IF privacy = 'public' THEN
    RETURN true;
  END IF;
  
  -- If it's the user's own profile, they can view it
  IF viewer_id = profile_id THEN
    RETURN true;
  END IF;
  
  -- If friends only, check if they are mutual followers
  IF privacy = 'friends' THEN
    SELECT EXISTS (
      SELECT 1 FROM follows f1
      JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
      WHERE f1.follower_id = viewer_id
      AND f1.following_id = profile_id
      AND f1.status = 'accepted'
      AND f2.status = 'accepted'
    ) INTO is_following;
    
    RETURN is_following;
  END IF;
  
  -- If private, only the user can view
  RETURN false;
END;
$$;

-- Create function to get follow status between two users
CREATE OR REPLACE FUNCTION get_follow_status(user_id uuid, target_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  follow_status text;
  reverse_status text;
BEGIN
  -- Check if user is following target
  SELECT status INTO follow_status
  FROM follows
  WHERE follower_id = user_id AND following_id = target_id;
  
  -- Check if target is following user
  SELECT status INTO reverse_status
  FROM follows
  WHERE follower_id = target_id AND following_id = user_id;
  
  -- Return appropriate status
  IF follow_status IS NULL THEN
    RETURN 'none';
  ELSIF follow_status = 'pending' THEN
    RETURN 'requested';
  ELSIF follow_status = 'accepted' AND reverse_status = 'accepted' THEN
    RETURN 'friends';
  ELSIF follow_status = 'accepted' THEN
    RETURN 'following';
  ELSE
    RETURN follow_status;
  END IF;
END;
$$;

-- Create function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count
  FROM follows
  WHERE following_id = user_id AND status = 'accepted';
  
  RETURN count;
END;
$$;

-- Create function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  count integer;
BEGIN
  SELECT COUNT(*) INTO count
  FROM follows
  WHERE follower_id = user_id AND status = 'accepted';
  
  RETURN count;
END;
$$;
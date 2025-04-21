-- Drop existing tables to start fresh
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS flags CASCADE;

-- Create posts table with correct relationships
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  content text NOT NULL,
  media_url text,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Create likes table
CREATE TABLE likes (
  id serial PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  UNIQUE(post_id, user_id)
);

-- Create flags table
CREATE TABLE flags (
  id serial PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Users can see all likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Flags policies
CREATE POLICY "Only admins can view flags"
  ON flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );

CREATE POLICY "Users can create flags"
  ON flags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add some sample data for testing
DO $$ 
DECLARE 
  demo_user_id uuid;
  activity_id uuid;
  post_id uuid;
BEGIN
  -- Get the demo user's ID
  SELECT id INTO demo_user_id 
  FROM profiles 
  WHERE email = 'demo@example.com' 
  LIMIT 1;

  -- Get a sample activity ID
  SELECT id INTO activity_id 
  FROM activities 
  LIMIT 1;

  -- Only proceed if we have both IDs
  IF demo_user_id IS NOT NULL AND activity_id IS NOT NULL THEN
    -- Add sample post
    INSERT INTO posts (id, user_id, activity_id, content, created_at)
    VALUES (
      gen_random_uuid(),
      demo_user_id,
      activity_id,
      'Just started this amazing activity! Looking forward to the journey ahead.',
      now()
    )
    RETURNING id INTO post_id;

    -- Add sample like
    IF post_id IS NOT NULL THEN
      INSERT INTO likes (post_id, user_id)
      VALUES (post_id, demo_user_id);
    END IF;
  END IF;
END $$;
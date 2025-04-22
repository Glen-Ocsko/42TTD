/*
  # Custom Activities Table

  1. New Tables
    - `custom_activities` - Stores user-created custom activities
  
  2. Changes
    - Add relationship to user_activities table
    - Add relationship to activity_posts table
    - Enable RLS on the new table
    - Add policies for user access control
*/

-- Create custom_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category_tags text[],
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE custom_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_activities
CREATE POLICY "Users can create their own custom activities" 
  ON custom_activities FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom activities" 
  ON custom_activities FOR DELETE TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom activities" 
  ON custom_activities FOR UPDATE TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own custom activities" 
  ON custom_activities FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Add constraint to activity_posts to ensure either activity_id or custom_activity_id is set, but not both
ALTER TABLE activity_posts ADD CONSTRAINT IF NOT EXISTS activity_reference_check 
  CHECK ((activity_id IS NOT NULL AND custom_activity_id IS NULL) OR 
         (activity_id IS NULL AND custom_activity_id IS NOT NULL));

-- Add foreign key to activity_posts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'activity_posts_custom_activity_id_fkey'
  ) THEN
    ALTER TABLE activity_posts 
    ADD COLUMN IF NOT EXISTS custom_activity_id uuid REFERENCES custom_activities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add proposed_for_main_list column to custom_activities
ALTER TABLE custom_activities ADD COLUMN IF NOT EXISTS proposed_for_main_list boolean DEFAULT false;

-- Add moderation_status column to custom_activities
ALTER TABLE custom_activities ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending' 
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

-- Add moderator_notes column to custom_activities
ALTER TABLE custom_activities ADD COLUMN IF NOT EXISTS moderator_notes text;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_custom_activities_user_id ON custom_activities(user_id);

-- Create index on proposed_for_main_list for better performance on moderation queries
CREATE INDEX IF NOT EXISTS idx_custom_activities_proposed ON custom_activities(proposed_for_main_list) 
  WHERE proposed_for_main_list = true;
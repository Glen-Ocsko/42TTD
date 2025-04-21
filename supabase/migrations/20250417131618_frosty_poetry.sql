/*
  # Update activities table RLS policies

  1. Security Changes
    - Enable RLS on activities table
    - Add policy for public read access to activities
*/

-- Enable RLS if not already enabled
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'activities' 
    AND policyname = 'Activities are viewable by everyone'
  ) THEN
    CREATE POLICY "Activities are viewable by everyone"
      ON activities
      FOR SELECT
      USING (true);
  END IF;
END $$;
/*
  # Add rating columns to user_activities table

  1. Changes
    - Add rating columns to user_activities table:
      - rating_difficulty (integer)
      - rating_cost (integer)
      - rating_enjoyment (integer)
    - Add constraints to ensure valid rating values (1-5)

  2. Notes
    - All rating columns are nullable since users may not rate immediately
    - Ratings are constrained to values between 1 and 5
*/

DO $$ 
BEGIN
  -- Add rating columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_activities' AND column_name = 'rating_difficulty'
  ) THEN
    ALTER TABLE user_activities ADD COLUMN rating_difficulty integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_activities' AND column_name = 'rating_cost'
  ) THEN
    ALTER TABLE user_activities ADD COLUMN rating_cost integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_activities' AND column_name = 'rating_enjoyment'
  ) THEN
    ALTER TABLE user_activities ADD COLUMN rating_enjoyment integer;
  END IF;

  -- Add check constraints for valid rating values
  ALTER TABLE user_activities 
    ADD CONSTRAINT rating_difficulty_check CHECK (rating_difficulty BETWEEN 1 AND 5),
    ADD CONSTRAINT rating_cost_check CHECK (rating_cost BETWEEN 1 AND 5),
    ADD CONSTRAINT rating_enjoyment_check CHECK (rating_enjoyment BETWEEN 1 AND 5);
END $$;
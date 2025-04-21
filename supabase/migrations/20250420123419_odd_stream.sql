/*
  # Update Activity Ratings System

  1. Changes
    - Add impact field to user_activity_ratings
    - Add popularity field to activities
    - Update trigger function to calculate popularity
    - Add check constraints for new fields

  2. Security
    - Maintain existing RLS policies
*/

-- Add impact field to user_activity_ratings
ALTER TABLE user_activity_ratings
ADD COLUMN IF NOT EXISTS impact integer CHECK (impact >= 1 AND impact <= 5);

-- Add popularity field to activities if it doesn't exist
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS popularity integer DEFAULT 0;

-- Update the trigger function to calculate popularity
CREATE OR REPLACE FUNCTION update_activity_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average ratings and popularity in activities table
  UPDATE activities
  SET 
    rating = COALESCE((
      SELECT AVG(rating)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND rating IS NOT NULL
    ), 0),
    difficulty = COALESCE((
      SELECT AVG(difficulty)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND difficulty IS NOT NULL
    ), 0),
    cost = COALESCE((
      SELECT AVG(cost)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND cost IS NOT NULL
    ), 0),
    enjoyment = COALESCE((
      SELECT AVG(enjoyment)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND enjoyment IS NOT NULL
    ), 0),
    time = COALESCE((
      SELECT AVG(time)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND time IS NOT NULL
    ), 0),
    adventurousness = COALESCE((
      SELECT AVG(adventurousness)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND adventurousness IS NOT NULL
    ), 0),
    creativity = COALESCE((
      SELECT AVG(creativity)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND creativity IS NOT NULL
    ), 0),
    fitness = COALESCE((
      SELECT AVG(fitness)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND fitness IS NOT NULL
    ), 0),
    learning = COALESCE((
      SELECT AVG(learning)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND learning IS NOT NULL
    ), 0),
    impact = COALESCE((
      SELECT AVG(impact)::numeric(3,2)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
      AND impact IS NOT NULL
    ), 0),
    popularity = (
      SELECT COUNT(*)
      FROM user_activity_ratings
      WHERE activity_id = NEW.activity_id
    )
  WHERE id = NEW.activity_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
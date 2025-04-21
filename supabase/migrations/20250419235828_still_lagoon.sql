/*
  # Add Activity Metrics Columns

  1. Changes
    - Add columns for rating, cost, enjoyment, time, and popularity metrics
    - Add check constraints to ensure valid values (1-5 scale)
    - Add default values where appropriate
    - Update existing activities with random sample data

  2. Impact
    - Enables sorting and filtering by these metrics
    - Supports activity recommendations
*/

-- Add new columns with constraints
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
ADD COLUMN IF NOT EXISTS cost integer DEFAULT 3 CHECK (cost >= 1 AND cost <= 5),
ADD COLUMN IF NOT EXISTS enjoyment numeric(3,2) DEFAULT 0 CHECK (enjoyment >= 0 AND enjoyment <= 5),
ADD COLUMN IF NOT EXISTS time integer DEFAULT 3 CHECK (time >= 1 AND time <= 5),
ADD COLUMN IF NOT EXISTS popularity integer DEFAULT 0;

-- Create function to calculate activity popularity
CREATE OR REPLACE FUNCTION calculate_activity_popularity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update popularity count in activities table
  UPDATE activities
  SET popularity = (
    SELECT COUNT(*)
    FROM user_activities
    WHERE activity_id = NEW.activity_id
  )
  WHERE id = NEW.activity_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update popularity when user_activities changes
DROP TRIGGER IF EXISTS update_activity_popularity ON user_activities;
CREATE TRIGGER update_activity_popularity
AFTER INSERT OR DELETE ON user_activities
FOR EACH ROW
EXECUTE FUNCTION calculate_activity_popularity();

-- Update existing activities with sample data
UPDATE activities
SET 
  rating = ROUND(CAST(2 + random() * 3 AS numeric), 2),
  enjoyment = ROUND(CAST(2 + random() * 3 AS numeric), 2),
  popularity = (
    SELECT COUNT(*)
    FROM user_activities
    WHERE activity_id = activities.id
  )
WHERE rating = 0;

-- Create function to update average ratings
CREATE OR REPLACE FUNCTION update_activity_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average ratings in activities table
  UPDATE activities
  SET 
    rating = COALESCE((
      SELECT AVG(NULLIF(rating_difficulty, 0))
      FROM user_activities
      WHERE activity_id = NEW.activity_id
    ), 0),
    enjoyment = COALESCE((
      SELECT AVG(NULLIF(rating_enjoyment, 0))
      FROM user_activities
      WHERE activity_id = NEW.activity_id
    ), 0)
  WHERE id = NEW.activity_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ratings when user_activities changes
DROP TRIGGER IF EXISTS update_activity_ratings ON user_activities;
CREATE TRIGGER update_activity_ratings
AFTER INSERT OR UPDATE OF rating_difficulty, rating_enjoyment ON user_activities
FOR EACH ROW
EXECUTE FUNCTION update_activity_ratings();
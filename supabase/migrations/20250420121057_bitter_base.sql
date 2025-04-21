/*
  # Create Activity Ratings System

  1. New Tables
    - `user_activity_ratings`
      - Stores user ratings for activities
      - Links to users and activities
      - Includes both public and detailed ratings
      - Tracks rating status and timestamps

  2. Security
    - Enable RLS
    - Add policies for user access
*/

CREATE TABLE user_activity_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  status text CHECK (status IN ('started', 'completed')),
  -- Public ratings
  difficulty integer CHECK (difficulty >= 1 AND difficulty <= 5),
  cost integer CHECK (cost >= 1 AND cost <= 5),
  enjoyment integer CHECK (enjoyment >= 1 AND enjoyment <= 5),
  time integer CHECK (time >= 1 AND time <= 5),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  -- Detailed characteristics
  adventurousness integer CHECK (adventurousness >= 1 AND adventurousness <= 5),
  creativity integer CHECK (creativity >= 1 AND creativity <= 5),
  fitness integer CHECK (fitness >= 1 AND fitness <= 5),
  learning integer CHECK (learning >= 1 AND learning <= 5),
  solo_social integer CHECK (solo_social >= 1 AND solo_social <= 5),
  indoor_outdoor integer CHECK (indoor_outdoor >= 1 AND indoor_outdoor <= 5),
  planning_required integer CHECK (planning_required >= 1 AND planning_required <= 5),
  risk_level integer CHECK (risk_level >= 1 AND risk_level <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, activity_id)
);

-- Enable RLS
ALTER TABLE user_activity_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own ratings"
  ON user_activity_ratings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ratings"
  ON user_activity_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON user_activity_ratings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update activity ratings
CREATE OR REPLACE FUNCTION update_activity_ratings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average ratings in activities table
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
    ), 0)
  WHERE id = NEW.activity_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ratings updates
CREATE TRIGGER update_activity_ratings
AFTER INSERT OR UPDATE ON user_activity_ratings
FOR EACH ROW
EXECUTE FUNCTION update_activity_ratings();
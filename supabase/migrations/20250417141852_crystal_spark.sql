/*
  # Create quiz scores table

  1. New Tables
    - `user_quiz_scores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `risk_tolerance` (integer)
      - `adventure` (integer)
      - `creativity` (integer)
      - `sociability` (integer)
      - `travel` (integer)
      - `budget` (integer)
      - `time` (integer)
      - `accessibility` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_quiz_scores` table
    - Add policies for users to:
      - Insert their own scores
      - View their own scores
*/

-- Create the quiz scores table
CREATE TABLE IF NOT EXISTS user_quiz_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_tolerance integer CHECK (risk_tolerance >= 0 AND risk_tolerance <= 10),
  adventure integer CHECK (adventure >= 0 AND adventure <= 100),
  creativity integer CHECK (creativity >= 0 AND creativity <= 100),
  sociability integer CHECK (sociability >= 0 AND sociability <= 100),
  travel integer CHECK (travel >= 0 AND travel <= 100),
  budget integer CHECK (budget >= 0 AND budget <= 100),
  time integer CHECK (time >= 0 AND time <= 100),
  accessibility integer CHECK (accessibility >= 0 AND accessibility <= 100),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE user_quiz_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own scores"
  ON user_quiz_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own scores"
  ON user_quiz_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add quiz_completed column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quiz_completed boolean DEFAULT false;
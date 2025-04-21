/*
  # Create Ad Feedback Table

  1. New Tables
    - `ad_feedback`
      - Stores user feedback about ads
      - Links to supplier_ads and users
      - Includes reason for hiding/reporting

  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create ad_feedback table
CREATE TABLE IF NOT EXISTS ad_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES supplier_ads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  reason text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ad_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own feedback"
  ON ad_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON ad_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON ad_feedback
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
/*
  # Add impact column to activities table

  1. Changes
    - Add impact column to activities table
    - Add check constraint for valid values
*/

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS impact numeric(3,2) DEFAULT 0 CHECK (impact >= 0 AND impact <= 5);
/*
  # Add location specific flag to activities

  1. Changes
    - Add `is_location_specific` boolean column to `activities` table with default value of false
    - This allows activities to be marked as requiring a specific location

  2. Impact
    - Existing activities will have is_location_specific set to false by default
    - Frontend can now filter activities by location requirement
*/

ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS is_location_specific boolean DEFAULT false;
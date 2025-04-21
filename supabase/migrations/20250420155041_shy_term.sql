/*
  # Add hobbies field to profiles table

  1. Changes
    - Add hobbies text column to profiles table
    - This allows users to store free-text hobbies information
    
  2. Security
    - No security changes needed
    - Uses existing RLS policies
*/

-- Add hobbies column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS hobbies text;
/*
  # Add activity categories

  1. Changes
    - Insert predefined categories into the `activity_categories` table
    - Each category gets a unique UUID and timestamp
    - Categories are ordered by their intended display order

  2. Security
    - No additional security policies needed as categories are public read-only data
*/

INSERT INTO activity_categories (id, name, created_at)
VALUES
  (gen_random_uuid(), 'Adventure & Adrenaline', now()),
  (gen_random_uuid(), 'Health & Fitness', now()),
  (gen_random_uuid(), 'Travel & Exploration', now()),
  (gen_random_uuid(), 'Personal Growth & Learning', now()),
  (gen_random_uuid(), 'Creative Expression', now()),
  (gen_random_uuid(), 'Career & Ambition', now()),
  (gen_random_uuid(), 'Kindness & Connection', now()),
  (gen_random_uuid(), 'Nature & Outdoors', now()),
  (gen_random_uuid(), 'Food & Drink', now()),
  (gen_random_uuid(), 'Life Milestones', now()),
  (gen_random_uuid(), 'Fun & Novelty', now()),
  (gen_random_uuid(), 'Style & Identity', now()),
  (gen_random_uuid(), 'Community & Events', now()),
  (gen_random_uuid(), 'Transport & Vehicles', now()),
  (gen_random_uuid(), 'Finance & Freedom', now());

-- Add a policy to allow public read access to categories
CREATE POLICY "Categories are viewable by everyone"
  ON activity_categories
  FOR SELECT
  TO public
  USING (true);
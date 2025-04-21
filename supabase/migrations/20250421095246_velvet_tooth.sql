/*
  # Add Linked Activities and Categories to Supplier Ads

  1. Changes
    - Add linked_activities column (text array) to supplier_ads table
    - Add linked_categories column (text array) to supplier_ads table
    - Add priority_level column (integer) to supplier_ads table
    - Update existing ads with sample linked activities and categories
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to supplier_ads table
ALTER TABLE supplier_ads
ADD COLUMN IF NOT EXISTS linked_activities text[],
ADD COLUMN IF NOT EXISTS linked_categories text[],
ADD COLUMN IF NOT EXISTS priority_level integer DEFAULT 0;

-- Update existing ads with sample linked activities and categories
UPDATE supplier_ads
SET 
  linked_activities = CASE 
    WHEN title ILIKE '%turtle%' THEN ARRAY['Release baby turtles into the ocean', 'Volunteer for marine conservation']
    WHEN title ILIKE '%pet%' OR title ILIKE '%adopt%' THEN ARRAY['Adopt a pet', 'Adopt a pet that needs a home', 'Volunteer at an animal shelter']
    WHEN title ILIKE '%seaplane%' THEN ARRAY['Arrive by seaplane', 'Take a scenic flight', 'Visit a remote island']
    WHEN title ILIKE '%play%' OR title ILIKE '%act%' OR title ILIKE '%theatre%' THEN ARRAY['Act in a play', 'Perform on stage', 'Join a community theatre']
    WHEN title ILIKE '%yoga%' THEN ARRAY['Try yoga', 'Attend a yoga retreat', 'Learn meditation']
    WHEN title ILIKE '%reality%' OR title ILIKE '%tv%' THEN ARRAY['Apply to be on a reality TV show', 'Appear on television']
    ELSE ARRAY[title]
  END,
  linked_categories = CASE
    WHEN title ILIKE '%turtle%' OR title ILIKE '%marine%' THEN ARRAY['Nature & Outdoors', 'Travel & Exploration', 'Social Impact']
    WHEN title ILIKE '%pet%' OR title ILIKE '%adopt%' OR title ILIKE '%animal%' THEN ARRAY['Community & Events', 'Social Impact', 'Life Milestones']
    WHEN title ILIKE '%seaplane%' OR title ILIKE '%island%' THEN ARRAY['Adventure & Adrenaline', 'Travel & Exploration']
    WHEN title ILIKE '%play%' OR title ILIKE '%act%' OR title ILIKE '%theatre%' THEN ARRAY['Creative Expression', 'Arts & Culture', 'Community & Events']
    WHEN title ILIKE '%yoga%' OR title ILIKE '%retreat%' THEN ARRAY['Health & Fitness', 'Personal Growth']
    WHEN title ILIKE '%reality%' OR title ILIKE '%tv%' THEN ARRAY['Career & Ambition', 'Fun & Novelty']
    ELSE activity_tags
  END,
  priority_level = CASE
    WHEN supplier_id IN (SELECT id FROM suppliers WHERE trusted_supplier = true) THEN 2
    ELSE 1
  END
WHERE linked_activities IS NULL;

-- Create function to match ads to activities
CREATE OR REPLACE FUNCTION match_ads_to_activity(activity_id uuid)
RETURNS TABLE (
  ad_id uuid,
  match_score integer
) AS $$
DECLARE
  activity_title text;
  activity_description text;
  activity_categories text[];
BEGIN
  -- Get activity details
  SELECT 
    title, 
    description, 
    category_tags
  INTO 
    activity_title, 
    activity_description, 
    activity_categories
  FROM activities
  WHERE id = activity_id;

  -- Return matched ads with scores
  RETURN QUERY
  SELECT 
    sa.id,
    (
      -- Exact activity match (highest priority)
      CASE WHEN sa.linked_activities @> ARRAY[activity_title] THEN 100 ELSE 0 END +
      -- Category match (medium priority)
      CASE WHEN sa.linked_categories && activity_categories THEN 50 ELSE 0 END +
      -- Keyword match (lowest priority)
      CASE WHEN 
        activity_title ILIKE ANY(SELECT '%' || unnest(sa.activity_tags) || '%') OR
        activity_description ILIKE ANY(SELECT '%' || unnest(sa.activity_tags) || '%')
      THEN 25 ELSE 0 END +
      -- Add priority level
      sa.priority_level * 10
    ) AS match_score
  FROM 
    supplier_ads sa
  WHERE 
    sa.approved = true AND
    (
      -- Match by linked activities
      sa.linked_activities @> ARRAY[activity_title] OR
      -- Match by linked categories
      sa.linked_categories && activity_categories OR
      -- Match by keywords
      activity_title ILIKE ANY(SELECT '%' || unnest(sa.activity_tags) || '%') OR
      activity_description ILIKE ANY(SELECT '%' || unnest(sa.activity_tags) || '%')
    )
  ORDER BY match_score DESC;
END;
$$ LANGUAGE plpgsql;
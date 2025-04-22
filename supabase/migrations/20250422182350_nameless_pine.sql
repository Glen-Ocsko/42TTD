/*
  # Add display_title to activities table

  1. Changes
    - Add display_title column to activities table
    - This allows for a user-friendly display version of the title
    - Original title field remains for sorting and identification
*/

-- Add display_title column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS display_title text;

-- Create a function to suggest display titles based on category tags
CREATE OR REPLACE FUNCTION suggest_display_title()
RETURNS TRIGGER AS $$
DECLARE
  category_tag text;
  prefix text;
BEGIN
  -- Only suggest if display_title is not provided and title exists
  IF NEW.display_title IS NULL AND NEW.title IS NOT NULL THEN
    -- Check if any category tags exist
    IF NEW.category_tags IS NOT NULL AND array_length(NEW.category_tags, 1) > 0 THEN
      -- Get the first category tag
      category_tag := NEW.category_tags[1];
      
      -- Determine prefix based on category
      IF category_tag LIKE '%Adventure%' THEN
        prefix := 'Go on a';
      ELSIF category_tag LIKE '%Arts%' OR category_tag LIKE '%Creative%' THEN
        prefix := 'Create a';
      ELSIF category_tag LIKE '%Food%' THEN
        prefix := 'Try';
      ELSIF category_tag LIKE '%Travel%' THEN
        prefix := 'Visit';
      ELSIF category_tag LIKE '%Fitness%' OR category_tag LIKE '%Health%' THEN
        prefix := 'Try';
      ELSIF category_tag LIKE '%Learning%' OR category_tag LIKE '%Skill%' THEN
        prefix := 'Learn';
      ELSE
        prefix := 'Try';
      END IF;
      
      -- Set the display title with the prefix
      NEW.display_title := prefix || ' ' || NEW.title;
    ELSE
      -- Default to just the title if no categories
      NEW.display_title := NEW.title;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to suggest display titles for new activities
CREATE TRIGGER suggest_display_title_trigger
BEFORE INSERT ON activities
FOR EACH ROW
EXECUTE FUNCTION suggest_display_title();

-- Update existing activities to have a display_title if they don't already
UPDATE activities
SET display_title = 
  CASE 
    WHEN category_tags IS NOT NULL AND array_length(category_tags, 1) > 0 THEN
      CASE 
        WHEN category_tags[1] LIKE '%Adventure%' THEN 'Go on a ' || title
        WHEN category_tags[1] LIKE '%Arts%' OR category_tags[1] LIKE '%Creative%' THEN 'Create a ' || title
        WHEN category_tags[1] LIKE '%Food%' THEN 'Try ' || title
        WHEN category_tags[1] LIKE '%Travel%' THEN 'Visit ' || title
        WHEN category_tags[1] LIKE '%Fitness%' OR category_tags[1] LIKE '%Health%' THEN 'Try ' || title
        WHEN category_tags[1] LIKE '%Learning%' OR category_tags[1] LIKE '%Skill%' THEN 'Learn ' || title
        ELSE 'Try ' || title
      END
    ELSE title
  END
WHERE display_title IS NULL;
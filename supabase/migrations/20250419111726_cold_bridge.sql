-- Add unsplash_keywords column if it doesn't exist
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS unsplash_keywords text,
ADD COLUMN IF NOT EXISTS status text;

-- Update existing activities with default keywords
UPDATE activities
SET unsplash_keywords = CASE
  WHEN title ILIKE '%surf%' THEN 'surfing,ocean,waves'
  WHEN title ILIKE '%hike%' OR title ILIKE '%trek%' THEN 'hiking,mountains,adventure'
  WHEN title ILIKE '%photo%' THEN 'photography,camera,art'
  WHEN title ILIKE '%cook%' OR title ILIKE '%bake%' THEN 'cooking,food,kitchen'
  WHEN title ILIKE '%paint%' OR title ILIKE '%draw%' THEN 'art,painting,creative'
  WHEN title ILIKE '%garden%' THEN 'garden,plants,nature'
  WHEN title ILIKE '%yoga%' OR title ILIKE '%meditate%' THEN 'yoga,meditation,wellness'
  WHEN title ILIKE '%music%' OR title ILIKE '%sing%' OR title ILIKE '%guitar%' THEN 'music,instrument,concert'
  WHEN title ILIKE '%travel%' OR title ILIKE '%explore%' THEN 'travel,adventure,journey'
  ELSE lower(regexp_replace(title, '[^a-zA-Z0-9]+', ',', 'g'))
END
WHERE unsplash_keywords IS NULL;
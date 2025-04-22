/*
  # Fix Remaining uid() References in SQL - Part 6

  This migration completes the fixes for remaining trigger functions,
  split into a separate file to avoid deadlocks.
*/

-- Fix any remaining functions that might use uid() in update_post_hashtags
CREATE OR REPLACE FUNCTION update_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_matches text[];
  hashtag_name text;
  hashtag_id uuid;
BEGIN
  -- Extract hashtags from content
  SELECT regexp_matches(NEW.content, '#([a-zA-Z0-9_]+)', 'g') INTO hashtag_matches;
  
  -- Store hashtags in the post's hashtags array
  NEW.hashtags := hashtag_matches;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix any remaining functions that might use uid() in process_post_hashtags
CREATE OR REPLACE FUNCTION process_post_hashtags()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_matches text[];
  hashtag_name text;
  hashtag_id uuid;
BEGIN
  -- Extract hashtags from content using regex
  SELECT array_agg(DISTINCT substring(m[1] FROM 2)) INTO hashtag_matches
  FROM regexp_matches(NEW.content, '(#[a-zA-Z0-9_]+)', 'g') AS m;
  
  -- Process each hashtag
  IF hashtag_matches IS NOT NULL THEN
    FOREACH hashtag_name IN ARRAY hashtag_matches
    LOOP
      -- Remove the # symbol
      hashtag_name := substring(hashtag_name FROM 2);
      
      -- Insert or get hashtag
      INSERT INTO hashtags (name, post_count)
      VALUES (hashtag_name, 1)
      ON CONFLICT (name) 
      DO UPDATE SET post_count = hashtags.post_count + 1
      RETURNING id INTO hashtag_id;
      
      -- Link post to hashtag
      INSERT INTO post_hashtags (post_id, hashtag_id)
      VALUES (NEW.id, hashtag_id)
      ON CONFLICT (post_id, hashtag_id) DO NOTHING;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix any remaining functions that might use uid() in update_hashtag_count
CREATE OR REPLACE FUNCTION update_hashtag_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE hashtags
    SET post_count = post_count + 1
    WHERE id = NEW.hashtag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE hashtags
    SET post_count = GREATEST(0, post_count - 1)
    WHERE id = OLD.hashtag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fix any remaining functions that might use uid() in calculate_activity_popularity
CREATE OR REPLACE FUNCTION calculate_activity_popularity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities
    SET popularity = popularity + 1
    WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities
    SET popularity = GREATEST(0, popularity - 1)
    WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fix any remaining functions that might use uid() in update_activity_ratings
CREATE OR REPLACE FUNCTION update_activity_ratings()
RETURNS TRIGGER AS $$
DECLARE
  avg_difficulty numeric;
  avg_enjoyment numeric;
  avg_cost numeric;
  avg_time numeric;
  avg_rating numeric;
BEGIN
  -- Calculate average ratings
  SELECT 
    AVG(rating_difficulty),
    AVG(rating_enjoyment),
    AVG(rating_cost),
    AVG(time),
    AVG(rating)
  INTO 
    avg_difficulty,
    avg_enjoyment,
    avg_cost,
    avg_time,
    avg_rating
  FROM 
    user_activity_ratings
  WHERE 
    activity_id = NEW.activity_id;
  
  -- Update the activity with the new average ratings
  UPDATE activities
  SET 
    difficulty = COALESCE(avg_difficulty, difficulty),
    enjoyment = COALESCE(avg_enjoyment, enjoyment),
    cost = COALESCE(avg_cost, cost),
    time = COALESCE(avg_time, time),
    rating = COALESCE(avg_rating, rating)
  WHERE 
    id = NEW.activity_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix any remaining functions that might use uid() in update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix any remaining functions that might use uid() in increment_ad_impressions
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE supplier_ads
  SET impressions = impressions + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in increment_ad_clicks
CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE supplier_ads
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
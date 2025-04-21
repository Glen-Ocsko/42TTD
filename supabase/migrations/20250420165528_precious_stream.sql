/*
  # Create Dummy Suppliers and Ads

  1. New Data
    - Add 6 new suppliers for specific activities
    - Create ads for each supplier with relevant tags
    - Set all as approved and trusted for demo purposes
    
  2. Security
    - No security changes needed
    - Uses existing RLS policies
*/

-- Insert dummy suppliers
INSERT INTO suppliers (
  id,
  user_id,
  supplier_name,
  supplier_type,
  description,
  location,
  website_url,
  contact_email,
  phone_number,
  logo_url,
  approved,
  trusted_supplier,
  created_at
) VALUES
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Ocean Conservation Trust',
    'charity',
    'We protect marine life and offer unique experiences to release baby turtles into the ocean.',
    'Florida, USA',
    'https://example.com/oceanconservation',
    'info@oceanconservation.example.com',
    '+1-555-123-4567',
    'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '45 days'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Paws & Whiskers Rescue',
    'charity',
    'We rescue and rehome pets in need, providing them with loving forever homes.',
    'London, UK',
    'https://example.com/pawsandwhiskers',
    'adopt@pawsandwhiskers.example.com',
    '+44-20-1234-5678',
    'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '60 days'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Island Seaplane Tours',
    'business',
    'Experience the thrill of arriving by seaplane to stunning island destinations.',
    'Thailand',
    'https://example.com/islandseaplane',
    'bookings@islandseaplane.example.com',
    '+66-2-123-4567',
    'https://images.unsplash.com/photo-1534481016308-0fca71578ae5?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '30 days'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Broadway Dreams Theatre Company',
    'business',
    'Join our community theatre productions and fulfill your dream of acting in a play.',
    'New York, USA',
    'https://example.com/broadwaydreams',
    'casting@broadwaydreams.example.com',
    '+1-212-555-7890',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '75 days'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Reality TV Casting Agency',
    'business',
    'We help you apply to be on popular reality TV shows and guide you through the casting process.',
    'Los Angeles, USA',
    'https://example.com/realitycasting',
    'apply@realitycasting.example.com',
    '+1-323-555-6789',
    'https://images.unsplash.com/photo-1586899028174-e7098604235b?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '15 days'
  ),
  (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Global Pet Adoption Network',
    'charity',
    'Connecting people with pets that need homes around the world. We specialize in international pet adoptions.',
    'Global',
    'https://example.com/globalpetadoption',
    'hello@globalpetadoption.example.com',
    '+1-800-555-4321',
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=200&h=200',
    true,
    true,
    now() - interval '90 days'
  );

-- Get the IDs of the suppliers we just created
WITH supplier_data AS (
  SELECT id, supplier_name FROM suppliers
  WHERE supplier_name IN (
    'Ocean Conservation Trust',
    'Paws & Whiskers Rescue',
    'Island Seaplane Tours',
    'Broadway Dreams Theatre Company',
    'Reality TV Casting Agency',
    'Global Pet Adoption Network'
  )
)

-- Insert ads for each supplier
INSERT INTO supplier_ads (
  id,
  supplier_id,
  title,
  description,
  image_url,
  cta_label,
  cta_link,
  activity_tags,
  location,
  approved,
  highlight_discount,
  member_discount,
  clicks,
  impressions,
  created_at
)
SELECT
  gen_random_uuid(),
  id,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Help Release Baby Turtles in Florida'
    WHEN 'Paws & Whiskers Rescue' THEN 'Adopt a Pet This Weekend'
    WHEN 'Island Seaplane Tours' THEN 'Arrive by Seaplane to Paradise Islands'
    WHEN 'Broadway Dreams Theatre Company' THEN 'Act in Our Next Community Play'
    WHEN 'Reality TV Casting Agency' THEN 'Apply for Top Reality TV Shows'
    WHEN 'Global Pet Adoption Network' THEN 'Give a Home to a Pet in Need'
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Join our conservation efforts and experience the magical moment of releasing baby turtles into the ocean. A once-in-a-lifetime experience that helps protect endangered species.'
    WHEN 'Paws & Whiskers Rescue' THEN 'Find your perfect companion at our adoption center. All pets are vaccinated, microchipped, and ready to join your family. Special discounts for 42 Things members!'
    WHEN 'Island Seaplane Tours' THEN 'Experience the thrill of arriving by seaplane to stunning island destinations. Our experienced pilots will give you breathtaking views and a smooth landing.'
    WHEN 'Broadway Dreams Theatre Company' THEN 'No experience necessary! Join our inclusive community theatre and fulfill your dream of acting in a play. All ages and abilities welcome.'
    WHEN 'Reality TV Casting Agency' THEN 'We have connections with major networks and streaming platforms. Let us help you apply to be on your favorite reality TV show with professional coaching.'
    WHEN 'Global Pet Adoption Network' THEN 'We handle all the paperwork and logistics of international pet adoption. Find your perfect companion from shelters around the world.'
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'https://images.unsplash.com/photo-1591025207163-942350e47db2?auto=format&fit=crop&w=800&h=500'
    WHEN 'Paws & Whiskers Rescue' THEN 'https://images.unsplash.com/photo-1587764379873-97837921fd44?auto=format&fit=crop&w=800&h=500'
    WHEN 'Island Seaplane Tours' THEN 'https://images.unsplash.com/photo-1628505048571-3c5c3e0e3a4a?auto=format&fit=crop&w=800&h=500'
    WHEN 'Broadway Dreams Theatre Company' THEN 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=800&h=500'
    WHEN 'Reality TV Casting Agency' THEN 'https://images.unsplash.com/photo-1586899028174-e7098604235b?auto=format&fit=crop&w=800&h=500'
    WHEN 'Global Pet Adoption Network' THEN 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=800&h=500'
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Join a Release'
    WHEN 'Paws & Whiskers Rescue' THEN 'Find Your Pet'
    WHEN 'Island Seaplane Tours' THEN 'Book a Flight'
    WHEN 'Broadway Dreams Theatre Company' THEN 'Join the Cast'
    WHEN 'Reality TV Casting Agency' THEN 'Apply Now'
    WHEN 'Global Pet Adoption Network' THEN 'Start Adoption'
  END,
  'https://example.com/booking',
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN ARRAY['Nature & Outdoors', 'Travel & Exploration', 'baby turtles', 'ocean', 'conservation']
    WHEN 'Paws & Whiskers Rescue' THEN ARRAY['Community & Events', 'adopt a pet', 'pet', 'animal', 'dog', 'cat']
    WHEN 'Island Seaplane Tours' THEN ARRAY['Adventure & Adrenaline', 'Travel & Exploration', 'seaplane', 'island', 'flying']
    WHEN 'Broadway Dreams Theatre Company' THEN ARRAY['Creative Expression', 'Arts & Culture', 'acting', 'theatre', 'play']
    WHEN 'Reality TV Casting Agency' THEN ARRAY['Career & Ambition', 'TV show', 'reality TV', 'casting', 'television']
    WHEN 'Global Pet Adoption Network' THEN ARRAY['Community & Events', 'Social Impact', 'adopt a pet', 'pet', 'animal', 'dog', 'cat']
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Florida, USA'
    WHEN 'Paws & Whiskers Rescue' THEN 'London, UK'
    WHEN 'Island Seaplane Tours' THEN 'Thailand'
    WHEN 'Broadway Dreams Theatre Company' THEN 'New York, USA'
    WHEN 'Reality TV Casting Agency' THEN 'Los Angeles, USA'
    WHEN 'Global Pet Adoption Network' THEN 'Global'
  END,
  true,
  true,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN '{"all": "10%", "premium": "20%", "pro": "30%"}'::jsonb
    WHEN 'Paws & Whiskers Rescue' THEN '{"all": "10%", "premium": "20%", "pro": "30%"}'::jsonb
    WHEN 'Island Seaplane Tours' THEN '{"all": "10%", "premium": "20%", "pro": "30%"}'::jsonb
    WHEN 'Broadway Dreams Theatre Company' THEN '{"all": "10%", "premium": "20%", "pro": "30%"}'::jsonb
    WHEN 'Reality TV Casting Agency' THEN '{"all": "10%", "premium": "20%", "pro": "30%"}'::jsonb
    WHEN 'Global Pet Adoption Network' THEN '{"all": "10%", "premium": "20%", "pro": "30%"}'::jsonb
  END,
  floor(random() * 50) + 10,
  floor(random() * 200) + 50,
  now() - (floor(random() * 30) || ' days')::interval
FROM supplier_data;

-- Create a few more ads with different discounts and tags
WITH supplier_data AS (
  SELECT id, supplier_name FROM suppliers
  WHERE supplier_name IN (
    'Ocean Conservation Trust',
    'Island Seaplane Tours',
    'Broadway Dreams Theatre Company'
  )
)

INSERT INTO supplier_ads (
  id,
  supplier_id,
  title,
  description,
  image_url,
  cta_label,
  cta_link,
  activity_tags,
  location,
  approved,
  highlight_discount,
  member_discount,
  clicks,
  impressions,
  created_at
)
SELECT
  gen_random_uuid(),
  id,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Volunteer for Marine Conservation'
    WHEN 'Island Seaplane Tours' THEN 'Private Seaplane Island Hopping'
    WHEN 'Broadway Dreams Theatre Company' THEN 'Theatre Workshop for Beginners'
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Join our team of volunteers for a week of marine conservation activities. Help with beach cleanups, turtle monitoring, and coral restoration.'
    WHEN 'Island Seaplane Tours' THEN 'Customize your own island hopping adventure with our private seaplane tours. Visit up to 5 islands in a single day.'
    WHEN 'Broadway Dreams Theatre Company' THEN 'Never acted before? Our beginner workshop will introduce you to the basics of acting, voice, and movement in a supportive environment.'
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=800&h=500'
    WHEN 'Island Seaplane Tours' THEN 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?auto=format&fit=crop&w=800&h=500'
    WHEN 'Broadway Dreams Theatre Company' THEN 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?auto=format&fit=crop&w=800&h=500'
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Volunteer Now'
    WHEN 'Island Seaplane Tours' THEN 'Plan Your Tour'
    WHEN 'Broadway Dreams Theatre Company' THEN 'Register'
  END,
  'https://example.com/booking',
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN ARRAY['Nature & Outdoors', 'Social Impact', 'volunteer', 'conservation', 'marine']
    WHEN 'Island Seaplane Tours' THEN ARRAY['Adventure & Adrenaline', 'Travel & Exploration', 'seaplane', 'island', 'private tour']
    WHEN 'Broadway Dreams Theatre Company' THEN ARRAY['Creative Expression', 'Arts & Culture', 'acting', 'workshop', 'beginner']
  END,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN 'Florida, USA'
    WHEN 'Island Seaplane Tours' THEN 'Thailand'
    WHEN 'Broadway Dreams Theatre Company' THEN 'New York, USA'
  END,
  true,
  true,
  CASE supplier_name
    WHEN 'Ocean Conservation Trust' THEN '{"all": "5%", "premium": "15%", "pro": "25%"}'::jsonb
    WHEN 'Island Seaplane Tours' THEN '{"all": "0%", "premium": "10%", "pro": "20%"}'::jsonb
    WHEN 'Broadway Dreams Theatre Company' THEN '{"all": "15%", "premium": "25%", "pro": "40%"}'::jsonb
  END,
  floor(random() * 30) + 5,
  floor(random() * 150) + 30,
  now() - (floor(random() * 15) || ' days')::interval
FROM supplier_data;
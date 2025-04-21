/*
  # Add Sample Activity Posts

  1. Changes
    - Add sample activity posts for demo user
    - Include variety of statuses and content
    - Add realistic timestamps
    - Include some with images

  2. Security
    - Use existing RLS policies
    - Link to demo user ID
*/

-- Add sample posts for activities
INSERT INTO activity_posts (
  user_id,
  activity_id,
  content,
  image_url,
  status,
  created_at
)
SELECT 
  '00000000-0000-0000-0000-000000000000', -- Demo user ID
  id,
  CASE floor(random() * 4)
    WHEN 0 THEN 'Just completed this amazing activity! Highly recommend to everyone. The experience was unforgettable and I learned so much. 🌟'
    WHEN 1 THEN 'Making great progress on this one. Taking it step by step and enjoying the journey. Can''t wait to reach the finish line! 🚀'
    WHEN 2 THEN 'Started this activity today! The beginning is always exciting. Looking forward to the challenges ahead. 💪'
    ELSE 'Halfway through and loving every moment. This has been such a rewarding experience so far. 🎯'
  END,
  CASE WHEN random() < 0.3 THEN 
    'https://source.unsplash.com/random/800x600/?adventure,activity'
  ELSE 
    NULL 
  END,
  CASE floor(random() * 2)
    WHEN 0 THEN 'in_progress'
    ELSE 'completed'
  END,
  now() - (floor(random() * 30) || ' days')::interval
FROM activities
WHERE id IN (
  SELECT id FROM activities ORDER BY random() LIMIT 5
);

-- Add some more recent posts
INSERT INTO activity_posts (
  user_id,
  activity_id,
  content,
  status,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM activities ORDER BY random() LIMIT 1),
    'Just had the most incredible experience completing this! The view from the top was absolutely breathtaking. Definitely worth all the preparation and effort. 🏔️ #Achievement #BucketList',
    'completed',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM activities ORDER BY random() LIMIT 1),
    'Started this journey today! First steps are always exciting. Can''t wait to see where this takes me. 🌱 #NewBeginnings',
    'in_progress',
    now() - interval '1 day'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    (SELECT id FROM activities ORDER BY random() LIMIT 1),
    'Making steady progress! Each day brings new challenges and learnings. The community here has been so supportive. 💫 #Progress #Growth',
    'in_progress',
    now() - interval '3 days'
  );
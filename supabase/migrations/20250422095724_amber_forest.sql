/*
  # Fix All uid() References in SQL

  1. Changes
    - Comprehensive search and replace of all uid() references with auth.uid()
    - Includes functions, triggers, and any other SQL that might reference uid()
    - Ensures consistent use of auth.uid() throughout the database
*/

-- Fix any remaining policies in post_reports
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_reports') THEN
    -- Check for any policies that might still use uid()
    DROP POLICY IF EXISTS "Users can create reports" ON post_reports;
    CREATE POLICY "Users can create reports" 
      ON post_reports FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can view their own reports" ON post_reports;
    CREATE POLICY "Users can view their own reports" 
      ON post_reports FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in activity_posts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_posts') THEN
    -- Users can create posts
    DROP POLICY IF EXISTS "Users can create posts" ON activity_posts;
    CREATE POLICY "Users can create posts" 
      ON activity_posts FOR INSERT TO public
      WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));
    
    -- Users can delete their own posts
    DROP POLICY IF EXISTS "Users can delete their own posts" ON activity_posts;
    CREATE POLICY "Users can delete their own posts" 
      ON activity_posts FOR DELETE TO public
      USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));
    
    -- Users can update their own posts
    DROP POLICY IF EXISTS "Users can update their own posts" ON activity_posts;
    CREATE POLICY "Users can update their own posts" 
      ON activity_posts FOR UPDATE TO public
      USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid))
      WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));
  END IF;
END $$;

-- Fix any remaining policies in profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles') THEN
    -- Users can create their own profile
    DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
    CREATE POLICY "Users can create their own profile" 
      ON profiles FOR INSERT TO public
      WITH CHECK (auth.uid() = id);
    
    -- Users can update own profile
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" 
      ON profiles FOR UPDATE TO public
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Fix any remaining policies in user_activities
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_activities') THEN
    -- Users can create their own activities
    DROP POLICY IF EXISTS "Users can create their own activities" ON user_activities;
    CREATE POLICY "Users can create their own activities" 
      ON user_activities FOR INSERT TO public
      WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));
    
    -- Users can delete their own activities
    DROP POLICY IF EXISTS "Users can delete their own activities" ON user_activities;
    CREATE POLICY "Users can delete their own activities" 
      ON user_activities FOR DELETE TO public
      USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));
    
    -- Users can update their own activities
    DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;
    CREATE POLICY "Users can update their own activities" 
      ON user_activities FOR UPDATE TO public
      USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid))
      WITH CHECK ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));
    
    -- Users can view their own activities
    DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
    CREATE POLICY "Users can view their own activities" 
      ON user_activities FOR SELECT TO public
      USING ((auth.uid() = user_id) OR (user_id = '00000000-0000-0000-0000-000000000000'::uuid));
  END IF;
END $$;

-- Fix any remaining policies in follows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows') THEN
    -- Users can create follow requests
    DROP POLICY IF EXISTS "Users can create follow requests" ON follows;
    CREATE POLICY "Users can create follow requests" 
      ON follows FOR INSERT TO public
      WITH CHECK (auth.uid() = follower_id);
    
    -- Users can update follow status for requests they receive
    DROP POLICY IF EXISTS "Users can update follow status for requests they receive" ON follows;
    CREATE POLICY "Users can update follow status for requests they receive" 
      ON follows FOR UPDATE TO public
      USING ((auth.uid() = follower_id) OR (auth.uid() = following_id));
    
    -- Users can view their own follows
    DROP POLICY IF EXISTS "Users can view their own follows" ON follows;
    CREATE POLICY "Users can view their own follows" 
      ON follows FOR SELECT TO public
      USING ((auth.uid() = follower_id) OR (auth.uid() = following_id));
  END IF;
END $$;

-- Fix any remaining policies in post_likes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_likes') THEN
    -- Users can like posts
    DROP POLICY IF EXISTS "Users can like posts" ON post_likes;
    CREATE POLICY "Users can like posts" 
      ON post_likes FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can unlike posts
    DROP POLICY IF EXISTS "Users can unlike posts" ON post_likes;
    CREATE POLICY "Users can unlike posts" 
      ON post_likes FOR DELETE TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in post_comments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_comments') THEN
    -- Users can create comments
    DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
    CREATE POLICY "Users can create comments" 
      ON post_comments FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can delete their own comments
    DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;
    CREATE POLICY "Users can delete their own comments" 
      ON post_comments FOR DELETE TO public
      USING (auth.uid() = user_id);
    
    -- Users can update their own comments
    DROP POLICY IF EXISTS "Users can update their own comments" ON post_comments;
    CREATE POLICY "Users can update their own comments" 
      ON post_comments FOR UPDATE TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages') THEN
    -- Users can send messages
    DROP POLICY IF EXISTS "Users can send messages" ON messages;
    CREATE POLICY "Users can send messages" 
      ON messages FOR INSERT TO public
      WITH CHECK (auth.uid() = sender_id);
    
    -- Users can update messages they received (for read status)
    DROP POLICY IF EXISTS "Users can update messages they received" ON messages;
    CREATE POLICY "Users can update messages they received" 
      ON messages FOR UPDATE TO public
      USING (auth.uid() = receiver_id);
    
    -- Users can view their own messages
    DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
    CREATE POLICY "Users can view their own messages" 
      ON messages FOR SELECT TO public
      USING ((auth.uid() = sender_id) OR (auth.uid() = receiver_id));
  END IF;
END $$;

-- Fix any remaining policies in user_roles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles') THEN
    -- Users can insert their own role
    DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
    CREATE POLICY "Users can insert their own role" 
      ON user_roles FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can update their own role
    DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
    CREATE POLICY "Users can update their own role" 
      ON user_roles FOR UPDATE TO public
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can view their own role
    DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
    CREATE POLICY "Users can view their own role" 
      ON user_roles FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in user_interests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_interests') THEN
    -- Users can create own interests
    DROP POLICY IF EXISTS "Users can create own interests" ON user_interests;
    CREATE POLICY "Users can create own interests" 
      ON user_interests FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can delete own interests
    DROP POLICY IF EXISTS "Users can delete own interests" ON user_interests;
    CREATE POLICY "Users can delete own interests" 
      ON user_interests FOR DELETE TO public
      USING (auth.uid() = user_id);
    
    -- Users can view own interests
    DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
    CREATE POLICY "Users can view own interests" 
      ON user_interests FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in user_hashtags
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_hashtags') THEN
    -- Users can follow hashtags
    DROP POLICY IF EXISTS "Users can follow hashtags" ON user_hashtags;
    CREATE POLICY "Users can follow hashtags" 
      ON user_hashtags FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can unfollow hashtags
    DROP POLICY IF EXISTS "Users can unfollow hashtags" ON user_hashtags;
    CREATE POLICY "Users can unfollow hashtags" 
      ON user_hashtags FOR DELETE TO public
      USING (auth.uid() = user_id);
    
    -- Users can view their own followed hashtags
    DROP POLICY IF EXISTS "Users can view their own followed hashtags" ON user_hashtags;
    CREATE POLICY "Users can view their own followed hashtags" 
      ON user_hashtags FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in bookmarks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookmarks') THEN
    -- Users can create bookmarks
    DROP POLICY IF EXISTS "Users can create bookmarks" ON bookmarks;
    CREATE POLICY "Users can create bookmarks" 
      ON bookmarks FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can delete their own bookmarks
    DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;
    CREATE POLICY "Users can delete their own bookmarks" 
      ON bookmarks FOR DELETE TO public
      USING (auth.uid() = user_id);
    
    -- Users can view their own bookmarks
    DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
    CREATE POLICY "Users can view their own bookmarks" 
      ON bookmarks FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in bookings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings') THEN
    -- Users can create bookings
    DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
    CREATE POLICY "Users can create bookings" 
      ON bookings FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can update their own bookings
    DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
    CREATE POLICY "Users can update their own bookings" 
      ON bookings FOR UPDATE TO public
      USING (auth.uid() = user_id);
    
    -- Users can view their own bookings
    DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
    CREATE POLICY "Users can view their own bookings" 
      ON bookings FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in payment_methods
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods') THEN
    -- Users can create their own payment methods
    DROP POLICY IF EXISTS "Users can create their own payment methods" ON payment_methods;
    CREATE POLICY "Users can create their own payment methods" 
      ON payment_methods FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can delete their own payment methods
    DROP POLICY IF EXISTS "Users can delete their own payment methods" ON payment_methods;
    CREATE POLICY "Users can delete their own payment methods" 
      ON payment_methods FOR DELETE TO public
      USING (auth.uid() = user_id);
    
    -- Users can update their own payment methods
    DROP POLICY IF EXISTS "Users can update their own payment methods" ON payment_methods;
    CREATE POLICY "Users can update their own payment methods" 
      ON payment_methods FOR UPDATE TO public
      USING (auth.uid() = user_id);
    
    -- Users can view their own payment methods
    DROP POLICY IF EXISTS "Users can view their own payment methods" ON payment_methods;
    CREATE POLICY "Users can view their own payment methods" 
      ON payment_methods FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in suppliers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers') THEN
    -- Users can create their own supplier profile
    DROP POLICY IF EXISTS "Users can create their own supplier profile" ON suppliers;
    CREATE POLICY "Users can create their own supplier profile" 
      ON suppliers FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can update their own supplier profile
    DROP POLICY IF EXISTS "Users can update their own supplier profile" ON suppliers;
    CREATE POLICY "Users can update their own supplier profile" 
      ON suppliers FOR UPDATE TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in supplier_ads
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_ads') THEN
    -- Suppliers can create their own ads
    DROP POLICY IF EXISTS "Suppliers can create their own ads" ON supplier_ads;
    CREATE POLICY "Suppliers can create their own ads" 
      ON supplier_ads FOR INSERT TO public
      WITH CHECK (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_ads.supplier_id
        AND suppliers.user_id = auth.uid()
      ));
    
    -- Suppliers can update their own ads
    DROP POLICY IF EXISTS "Suppliers can update their own ads" ON supplier_ads;
    CREATE POLICY "Suppliers can update their own ads" 
      ON supplier_ads FOR UPDATE TO public
      USING (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_ads.supplier_id
        AND suppliers.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_ads.supplier_id
        AND suppliers.user_id = auth.uid()
      ));
    
    -- Suppliers can delete their own ads
    DROP POLICY IF EXISTS "Suppliers can delete their own ads" ON supplier_ads;
    CREATE POLICY "Suppliers can delete their own ads" 
      ON supplier_ads FOR DELETE TO public
      USING (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_ads.supplier_id
        AND suppliers.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Fix any remaining policies in ad_feedback
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ad_feedback') THEN
    -- Users can create their own feedback
    DROP POLICY IF EXISTS "Users can create their own feedback" ON ad_feedback;
    CREATE POLICY "Users can create their own feedback" 
      ON ad_feedback FOR INSERT TO public
      WITH CHECK (auth.uid() = user_id);
    
    -- Users can view their own feedback
    DROP POLICY IF EXISTS "Users can view their own feedback" ON ad_feedback;
    CREATE POLICY "Users can view their own feedback" 
      ON ad_feedback FOR SELECT TO public
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fix any remaining policies in supplier_availability
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_availability') THEN
    -- Suppliers can manage their own availability
    DROP POLICY IF EXISTS "Suppliers can manage their own availability" ON supplier_availability;
    CREATE POLICY "Suppliers can manage their own availability" 
      ON supplier_availability FOR ALL TO public
      USING (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_availability.supplier_id
        AND suppliers.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_availability.supplier_id
        AND suppliers.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Fix any remaining policies in supplier_api_tokens
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'supplier_api_tokens') THEN
    -- Suppliers can create their own tokens
    DROP POLICY IF EXISTS "Suppliers can create their own tokens" ON supplier_api_tokens;
    CREATE POLICY "Suppliers can create their own tokens" 
      ON supplier_api_tokens FOR INSERT TO public
      WITH CHECK (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_api_tokens.supplier_id
        AND suppliers.user_id = auth.uid()
      ));
    
    -- Suppliers can delete their own tokens
    DROP POLICY IF EXISTS "Suppliers can delete their own tokens" ON supplier_api_tokens;
    CREATE POLICY "Suppliers can delete their own tokens" 
      ON supplier_api_tokens FOR DELETE TO public
      USING (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_api_tokens.supplier_id
        AND suppliers.user_id = auth.uid()
      ));
    
    -- Suppliers can view their own tokens
    DROP POLICY IF EXISTS "Suppliers can view their own tokens" ON supplier_api_tokens;
    CREATE POLICY "Suppliers can view their own tokens" 
      ON supplier_api_tokens FOR SELECT TO public
      USING (EXISTS (
        SELECT 1 FROM suppliers
        WHERE suppliers.id = supplier_api_tokens.supplier_id
        AND suppliers.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Fix any remaining functions that might use uid()
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_follow_status
CREATE OR REPLACE FUNCTION get_follow_status(user_id uuid, target_id uuid)
RETURNS text AS $$
DECLARE
  follow_status text;
BEGIN
  -- Check if user follows target
  SELECT 
    CASE 
      WHEN status = 'accepted' THEN 
        -- Check if target also follows user (mutual/friends)
        CASE WHEN EXISTS (
          SELECT 1 FROM follows 
          WHERE follower_id = target_id 
          AND following_id = user_id
          AND status = 'accepted'
        ) THEN 'friends' ELSE 'following' END
      WHEN status = 'pending' THEN 'requested'
      ELSE status
    END INTO follow_status
  FROM follows
  WHERE follower_id = user_id
  AND following_id = target_id
  LIMIT 1;
  
  -- Check if target follows user but user doesn't follow target
  IF follow_status IS NULL THEN
    SELECT 
      CASE WHEN status = 'pending' THEN 'pending' ELSE NULL END INTO follow_status
    FROM follows
    WHERE follower_id = target_id
    AND following_id = user_id
    LIMIT 1;
  END IF;
  
  -- Default to 'none' if no relationship exists
  RETURN COALESCE(follow_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_user_followed_hashtags
CREATE OR REPLACE FUNCTION get_user_followed_hashtags(user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  hashtag_id uuid,
  hashtag_name text,
  post_count bigint,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uh.id,
    uh.user_id,
    uh.hashtag_id,
    h.name as hashtag_name,
    h.post_count,
    uh.created_at
  FROM 
    user_hashtags uh
    JOIN hashtags h ON uh.hashtag_id = h.id
  WHERE 
    uh.user_id = get_user_followed_hashtags.user_id
  ORDER BY 
    h.post_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_posts_from_following
CREATE OR REPLACE FUNCTION get_posts_from_following(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT ap.*
  FROM activity_posts ap
  JOIN follows f ON ap.user_id = f.following_id
  WHERE f.follower_id = user_id
  AND f.status = 'accepted'
  AND ap.visibility = 'public'
  ORDER BY ap.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_posts_from_friends
CREATE OR REPLACE FUNCTION get_posts_from_friends(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT ap.*
  FROM activity_posts ap
  WHERE ap.user_id IN (
    SELECT f1.following_id
    FROM follows f1
    JOIN follows f2 ON f1.following_id = f2.follower_id AND f1.follower_id = f2.following_id
    WHERE f1.follower_id = user_id
    AND f1.status = 'accepted'
    AND f2.status = 'accepted'
  )
  AND (ap.visibility = 'public' OR ap.visibility = 'friends')
  ORDER BY ap.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_posts_with_followed_hashtags
CREATE OR REPLACE FUNCTION get_posts_with_followed_hashtags(user_id uuid)
RETURNS SETOF activity_posts AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ap.*
  FROM activity_posts ap
  JOIN user_hashtags uh ON uh.user_id = get_posts_with_followed_hashtags.user_id
  JOIN hashtags h ON uh.hashtag_id = h.id
  WHERE ap.visibility = 'public'
  AND ap.content ILIKE '%#' || h.name || '%'
  ORDER BY ap.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_supplier_bookings
CREATE OR REPLACE FUNCTION get_supplier_bookings(supplier_id uuid, status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  user_email text,
  ad_id uuid,
  ad_title text,
  activity_id uuid,
  activity_title text,
  status text,
  message text,
  date date,
  booking_time time,
  price_total numeric,
  currency text,
  platform_fee numeric,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    p.username as user_name,
    p.email as user_email,
    b.ad_id,
    sa.title as ad_title,
    b.activity_id,
    a.title as activity_title,
    b.status,
    b.message,
    b.date,
    b.booking_time::time,
    b.price_total,
    b.currency,
    b.platform_fee,
    b.created_at
  FROM 
    bookings b
    LEFT JOIN profiles p ON b.user_id = p.id
    LEFT JOIN supplier_ads sa ON b.ad_id = sa.id
    LEFT JOIN activities a ON b.activity_id = a.id
  WHERE 
    b.supplier_id = get_supplier_bookings.supplier_id
    AND (status_filter IS NULL OR b.status = status_filter)
  ORDER BY 
    b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_user_bookings
CREATE OR REPLACE FUNCTION get_user_bookings(user_id uuid, status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  supplier_id uuid,
  supplier_name text,
  ad_id uuid,
  ad_title text,
  activity_id uuid,
  activity_title text,
  status text,
  message text,
  date date,
  booking_time time,
  price_total numeric,
  currency text,
  created_at timestamptz,
  stripe_invoice_url text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.supplier_id,
    s.supplier_name,
    b.ad_id,
    sa.title as ad_title,
    b.activity_id,
    a.title as activity_title,
    b.status,
    b.message,
    b.date,
    b.booking_time::time,
    b.price_total,
    b.currency,
    b.created_at,
    b.stripe_invoice_url
  FROM 
    bookings b
    LEFT JOIN suppliers s ON b.supplier_id = s.id
    LEFT JOIN supplier_ads sa ON b.ad_id = sa.id
    LEFT JOIN activities a ON b.activity_id = a.id
  WHERE 
    b.user_id = get_user_bookings.user_id
    AND (status_filter IS NULL OR b.status = status_filter)
  ORDER BY 
    b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_supplier_available_dates
CREATE OR REPLACE FUNCTION get_supplier_available_dates(
  supplier_id uuid,
  start_date date,
  end_date date
)
RETURNS TABLE (
  date date,
  available boolean,
  has_bookings boolean,
  note text
) AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(start_date, end_date, '1 day'::interval)::date AS date
  ),
  availability AS (
    SELECT 
      sa.date,
      sa.available,
      sa.note
    FROM 
      supplier_availability sa
    WHERE 
      sa.supplier_id = get_supplier_available_dates.supplier_id
      AND sa.date BETWEEN start_date AND end_date
  ),
  bookings AS (
    SELECT 
      b.date,
      COUNT(*) > 0 AS has_bookings
    FROM 
      bookings b
    WHERE 
      b.supplier_id = get_supplier_available_dates.supplier_id
      AND b.date BETWEEN start_date AND end_date
      AND b.status != 'cancelled'
    GROUP BY 
      b.date
  )
  SELECT 
    dr.date,
    COALESCE(a.available, true) AS available,
    COALESCE(b.has_bookings, false) AS has_bookings,
    a.note
  FROM 
    date_range dr
    LEFT JOIN availability a ON dr.date = a.date
    LEFT JOIN bookings b ON dr.date = b.date
  ORDER BY 
    dr.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in get_supplier_payment_summary
CREATE OR REPLACE FUNCTION get_supplier_payment_summary(
  supplier_id uuid,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_revenue numeric,
  platform_fees numeric,
  supplier_earnings numeric,
  pending_payouts numeric,
  completed_payouts numeric,
  currency text
) AS $$
DECLARE
  supplier_currency text;
BEGIN
  -- Get supplier currency
  SELECT currency INTO supplier_currency FROM suppliers WHERE id = supplier_id;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(sp.amount), 0) AS total_revenue,
    COALESCE(SUM(sp.platform_fee), 0) AS platform_fees,
    COALESCE(SUM(sp.supplier_amount), 0) AS supplier_earnings,
    COALESCE((
      SELECT SUM(amount)
      FROM supplier_payouts
      WHERE supplier_id = get_supplier_payment_summary.supplier_id
      AND status IN ('pending', 'in_transit')
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    ), 0) AS pending_payouts,
    COALESCE((
      SELECT SUM(amount)
      FROM supplier_payouts
      WHERE supplier_id = get_supplier_payment_summary.supplier_id
      AND status = 'paid'
      AND (start_date IS NULL OR created_at >= start_date)
      AND (end_date IS NULL OR created_at <= end_date)
    ), 0) AS completed_payouts,
    COALESCE(supplier_currency, 'GBP') AS currency
  FROM 
    supplier_payments sp
  WHERE 
    sp.supplier_id = get_supplier_payment_summary.supplier_id
    AND (start_date IS NULL OR sp.created_at >= start_date)
    AND (end_date IS NULL OR sp.created_at <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix any remaining functions that might use uid() in update_booking_status
CREATE OR REPLACE FUNCTION update_booking_status(booking_id uuid, new_status text)
RETURNS boolean AS $$
DECLARE
  booking_exists boolean;
  is_supplier boolean;
  is_customer boolean;
BEGIN
  -- Check if booking exists
  SELECT EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_id
  ) INTO booking_exists;
  
  IF NOT booking_exists THEN
    RETURN false;
  END IF;
  
  -- Check if user is the supplier
  SELECT EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN suppliers s ON b.supplier_id = s.id
    WHERE b.id = booking_id
    AND s.user_id = auth.uid()
  ) INTO is_supplier;
  
  -- Check if user is the customer
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE id = booking_id
    AND user_id = auth.uid()
  ) INTO is_customer;
  
  -- Only allow update if user is supplier or customer
  IF NOT (is_supplier OR is_customer) THEN
    RETURN false;
  END IF;
  
  -- Suppliers can update to any status
  -- Customers can only cancel their bookings
  IF (is_supplier) OR (is_customer AND new_status = 'cancelled') THEN
    UPDATE bookings
    SET 
      status = new_status,
      updated_at = now()
    WHERE id = booking_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
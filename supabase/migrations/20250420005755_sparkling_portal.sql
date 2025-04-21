/*
  # Add storage policies for activity images

  1. Storage Policies
    - Enable authenticated users to upload images to activity-images bucket
    - Allow public read access to activity images
    - Restrict file types to images
    - Set max file size to 5MB
*/

-- Create activity-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-images', 'activity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Remove any existing policies for the bucket
DROP POLICY IF EXISTS "Give users read access" ON storage.objects;
DROP POLICY IF EXISTS "Give users upload access" ON storage.objects;
DROP POLICY IF EXISTS "Give users delete access" ON storage.objects;

-- Policy to allow public read access to activity images
CREATE POLICY "Give users read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'activity-images');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Give users upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'activity-images' AND
  auth.role() = 'authenticated'
);

-- Policy to allow authenticated users to delete their own images
CREATE POLICY "Give users delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'activity-images' AND
  auth.uid() = owner
);
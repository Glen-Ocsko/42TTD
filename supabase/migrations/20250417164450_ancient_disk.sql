/*
  # Add Supplier Requests Table

  1. New Table
    - `supplier_requests`
      - For tracking business inquiries about promoting activities
      - Includes business details and contact information
      - Status tracking for request processing

  2. Security
    - Enable RLS
    - Add policies for:
      - Public insert access (anyone can submit a request)
      - Admin-only read access
*/

CREATE TABLE IF NOT EXISTS supplier_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  website_url text,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'contacted', 'approved', 'rejected')),
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE supplier_requests ENABLE ROW LEVEL SECURITY;

-- Allow public submissions
CREATE POLICY "Anyone can submit supplier requests"
  ON supplier_requests
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view requests
CREATE POLICY "Only admins can view supplier requests"
  ON supplier_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role = 'admin'
    )
  );
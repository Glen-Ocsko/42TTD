/*
  # Add insert policy for profiles table

  1. Changes
    - Add RLS policy to allow users to create their own profile during registration
    
  2. Security
    - Policy ensures users can only create a profile with their own auth ID
    - Maintains existing RLS policies for other operations
*/

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
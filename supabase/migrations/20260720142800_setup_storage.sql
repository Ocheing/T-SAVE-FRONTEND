-- Migration: 20260720142800_setup_storage.sql
-- Description: Create the 'images' storage bucket and configure RLS policies for admins and public access.

-- 1. Insert the 'images' bucket into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read objects
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- 3. Allow authenticated admins to upload (INSERT)
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.role IN ('admin', 'super_admin')
    )
  )
);

-- 4. Allow authenticated admins to update
CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.role IN ('admin', 'super_admin')
    )
  )
);

-- 5. Allow authenticated admins to delete
CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid() 
      AND admin_users.role IN ('admin', 'super_admin')
    )
  )
);

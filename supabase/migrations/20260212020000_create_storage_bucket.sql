-- Create profile_images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_images',
  'profile_images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile_images' AND 
  (auth.uid()::text = (SPLIT_PART(name, '/', 1)) OR 
   SPLIT_PART(name, '/', 2) LIKE auth.uid()::text || '%')
);

CREATE POLICY "Users can view their own profile images" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'profile_images' AND 
  (auth.uid()::text = (SPLIT_PART(name, '/', 1)) OR 
   SPLIT_PART(name, '/', 2) LIKE auth.uid()::text || '%')
);

CREATE POLICY "Users can update their own profile images" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile_images' AND 
  (auth.uid()::text = (SPLIT_PART(name, '/', 1)) OR 
   SPLIT_PART(name, '/', 2) LIKE auth.uid()::text || '%')
);

CREATE POLICY "Users can delete their own profile images" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile_images' AND 
  (auth.uid()::text = (SPLIT_PART(name, '/', 1)) OR 
   SPLIT_PART(name, '/', 2) LIKE auth.uid()::text || '%')
);

CREATE POLICY "Profile images are publicly viewable" ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'profile_images');

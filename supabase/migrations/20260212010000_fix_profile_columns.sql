-- Add missing profile columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_color TEXT DEFAULT '#5865F2';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create profile_images storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_images',
  'profile_images',
  true,
  10485760,
  'image/*'
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'profile_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own profile images" ON storage.objects FOR SELECT 
  USING (bucket_id = 'profile_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile images" ON storage.objects FOR UPDATE 
  USING (bucket_id = 'profile_images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images" ON storage.objects FOR DELETE 
  USING (bucket_id = 'profile_images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile images are publicly viewable" ON storage.objects FOR SELECT 
  USING (bucket_id = 'profile_images');

-- Update RLS policies for profiles to include new columns
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

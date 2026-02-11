-- Add missing profile_color column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN profile_color TEXT DEFAULT '#5865F2';

-- Fix missing RLS policies for channels
CREATE POLICY "Server owners can create channels" ON public.channels FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'owner'
  )
);

CREATE POLICY "Server admins can create channels" ON public.channels FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Channel creators can edit channels" ON public.channels FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Server owners can delete channels" ON public.channels FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'owner'
  )
);

-- Fix missing RLS policies for channel categories
CREATE POLICY "Server owners can create categories" ON public.channel_categories FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'owner'
  )
);

CREATE POLICY "Server admins can create categories" ON public.channel_categories FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

-- Add missing storage bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_images', 
  'profile_images', 
  true, 
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile images
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

-- Add badges table if not exists
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add user_badges table if not exists
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Insert default badges
INSERT INTO public.badges (name, icon, description) VALUES
  ('Dev', '👨‍💻', 'Application Developer'),
  ('Official Staff', '🏢', 'Company/Program Staff'),
  ('Moderator', '🛡️', 'Community Moderator'),
  ('VIP', '⭐', 'Very Important Person'),
  ('Early Adopter', '🌟', 'Early Supporter')
ON CONFLICT DO NOTHING;

-- RLS policies for badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by all" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL TO authenticated USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

CREATE POLICY "User badges viewable by all" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage user badges" ON public.user_badges FOR ALL TO authenticated USING (EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
));

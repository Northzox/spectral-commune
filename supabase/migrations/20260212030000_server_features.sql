-- Add server icon and banner columns
ALTER TABLE public.servers 
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create server_images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'server_images',
  'server_images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS policies for server images
CREATE POLICY "Server owners can upload server images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'server_images' AND 
  EXISTS (
    SELECT 1 FROM public.servers s 
    WHERE s.id = (SPLIT_PART(name, '/', 1)) 
    AND EXISTS (
      SELECT 1 FROM public.server_members sm 
      WHERE sm.server_id = s.id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'owner'
    )
  )
);

CREATE POLICY "Server images are publicly viewable" ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'server_images');

CREATE POLICY "Server owners can update server images" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'server_images' AND 
  EXISTS (
    SELECT 1 FROM public.servers s 
    WHERE s.id = (SPLIT_PART(name, '/', 1)) 
    AND EXISTS (
      SELECT 1 FROM public.server_members sm 
      WHERE sm.server_id = s.id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'owner'
    )
  )
);

CREATE POLICY "Server owners can delete server images" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'server_images' AND 
  EXISTS (
    SELECT 1 FROM public.servers s 
    WHERE s.id = (SPLIT_PART(name, '/', 1)) 
    AND EXISTS (
      SELECT 1 FROM public.server_members sm 
      WHERE sm.server_id = s.id 
      AND sm.user_id = auth.uid() 
      AND sm.role = 'owner'
    )
  )
);

-- Create custom roles table
CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#5865F2',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create server member custom roles junction table
CREATE TABLE IF NOT EXISTS public.server_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_member_id UUID REFERENCES public.server_members(id) ON DELETE CASCADE NOT NULL,
  custom_role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(server_member_id, custom_role_id)
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_member_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom roles
CREATE POLICY "Server members can view custom roles" ON public.custom_roles FOR SELECT USING (true);

CREATE POLICY "Server owners and admins can manage custom roles" ON public.custom_roles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = custom_roles.server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

-- RLS policies for server member roles
CREATE POLICY "Server members can view member roles" ON public.server_member_roles FOR SELECT USING (true);

CREATE POLICY "Server owners and admins can manage member roles" ON public.server_member_roles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = (
      SELECT server_id FROM public.server_members sm2 
      WHERE sm2.id = server_member_roles.server_member_id
    ) 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

-- Update trigger for custom roles
CREATE TRIGGER update_custom_roles_updated_at 
  BEFORE UPDATE ON public.custom_roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

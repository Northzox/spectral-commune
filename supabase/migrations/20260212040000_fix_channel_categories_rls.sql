-- Fix RLS policies for channel_categories table
-- Add missing INSERT, UPDATE, DELETE policies

DROP POLICY IF EXISTS "Categories viewable by members" ON public.channel_categories;

-- SELECT policy - viewable by server members
CREATE POLICY "Categories viewable by members" ON public.channel_categories FOR SELECT TO authenticated 
USING (public.is_server_member(auth.uid(), server_id));

-- INSERT policy - server owners and admins can create categories
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

-- UPDATE policy - server owners and admins can update categories
CREATE POLICY "Server owners can update categories" ON public.channel_categories FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'owner'
  )
);

CREATE POLICY "Server admins can update categories" ON public.channel_categories FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

-- DELETE policy - server owners can delete categories
CREATE POLICY "Server owners can delete categories" ON public.channel_categories FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'owner'
  )
);

-- Also fix channels RLS policies to be complete
DROP POLICY IF EXISTS "Channels viewable by members" ON public.channels;

-- SELECT policy - viewable by server members
CREATE POLICY "Channels viewable by members" ON public.channels FOR SELECT TO authenticated 
USING (public.is_server_member(auth.uid(), server_id));

-- INSERT policy - server owners and admins can create channels
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

-- UPDATE policy - server owners and admins can update channels
CREATE POLICY "Server owners can update channels" ON public.channels FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'owner'
  )
);

CREATE POLICY "Server admins can update channels" ON public.channels FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

-- DELETE policy - server owners can delete channels
CREATE POLICY "Server owners can delete channels" ON public.channels FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.server_members sm 
    WHERE sm.server_id = server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role = 'owner'
  )
);

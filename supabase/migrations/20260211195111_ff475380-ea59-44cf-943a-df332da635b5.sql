
-- Haunted Cord Database Schema

-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- User presence enum
CREATE TYPE public.user_presence AS ENUM ('online', 'idle', 'dnd', 'invisible', 'offline');

-- Channel type enum
CREATE TYPE public.channel_type AS ENUM ('text', 'voice', 'stage', 'announcement', 'forum');

-- Appeal status enum
CREATE TYPE public.appeal_status AS ENUM ('pending', 'approved', 'denied');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT DEFAULT '',
  custom_status TEXT DEFAULT '',
  presence public.user_presence DEFAULT 'offline',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, badge_id)
);

-- Servers
CREATE TABLE public.servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_url TEXT,
  banner_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Server members
CREATE TABLE public.server_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(server_id, user_id)
);

-- Server roles
CREATE TABLE public.server_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#ffffff',
  position INTEGER DEFAULT 0,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Server member roles
CREATE TABLE public.server_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_member_id UUID REFERENCES public.server_members(id) ON DELETE CASCADE NOT NULL,
  server_role_id UUID REFERENCES public.server_roles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(server_member_id, server_role_id)
);

-- Channel categories
CREATE TABLE public.channel_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

-- Channels
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.channel_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  topic TEXT DEFAULT '',
  type public.channel_type DEFAULT 'text',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  thread_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Message reactions
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Server invites
CREATE TABLE public.server_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bans
CREATE TABLE public.bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  banned_by UUID REFERENCES auth.users(id),
  reason TEXT DEFAULT '',
  ip_address TEXT,
  server_id UUID REFERENCES public.servers(id) ON DELETE CASCADE,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Appeals
CREATE TABLE public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ban_id UUID REFERENCES public.bans(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status public.appeal_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check server membership
CREATE OR REPLACE FUNCTION public.is_server_member(_user_id UUID, _server_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.server_members
    WHERE user_id = _user_id AND server_id = _server_id
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  -- Auto-assign admin role for whitelisted email
  IF NEW.email = 'northlable69@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies

-- Profiles: anyone can read, users can update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles: viewable by authenticated
CREATE POLICY "Roles viewable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Badges: viewable by all
CREATE POLICY "Badges viewable by all" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User badges: viewable by all
CREATE POLICY "User badges viewable by all" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Admins manage user badges" ON public.user_badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Servers: viewable by all, manageable by owner
CREATE POLICY "Servers viewable by all" ON public.servers FOR SELECT USING (true);
CREATE POLICY "Authenticated can create servers" ON public.servers FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can update server" ON public.servers FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owner can delete server" ON public.servers FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- Server members
CREATE POLICY "Members viewable by server members" ON public.server_members FOR SELECT TO authenticated USING (public.is_server_member(auth.uid(), server_id));
CREATE POLICY "Users can join servers" ON public.server_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave servers" ON public.server_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Server roles: viewable by members
CREATE POLICY "Server roles viewable by members" ON public.server_roles FOR SELECT TO authenticated USING (public.is_server_member(auth.uid(), server_id));

-- Channel categories: viewable by members
CREATE POLICY "Categories viewable by members" ON public.channel_categories FOR SELECT TO authenticated USING (public.is_server_member(auth.uid(), server_id));

-- Channels: viewable by members
CREATE POLICY "Channels viewable by members" ON public.channels FOR SELECT TO authenticated USING (public.is_server_member(auth.uid(), server_id));

-- Messages: viewable by channel server members
CREATE POLICY "Messages viewable by members" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_id AND public.is_server_member(auth.uid(), c.server_id)
  ));
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM public.channels c
    WHERE c.id = channel_id AND public.is_server_member(auth.uid(), c.server_id)
  ));
CREATE POLICY "Authors can edit messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- Reactions
CREATE POLICY "Reactions viewable by members" ON public.message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Invites
CREATE POLICY "Invites viewable by all" ON public.server_invites FOR SELECT USING (true);
CREATE POLICY "Members can create invites" ON public.server_invites FOR INSERT TO authenticated
  WITH CHECK (public.is_server_member(auth.uid(), server_id));

-- Bans: admins only
CREATE POLICY "Admins can view bans" ON public.bans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Admins can manage bans" ON public.bans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Appeals
CREATE POLICY "Users can view own appeals" ON public.appeals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create appeals" ON public.appeals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage appeals" ON public.appeals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Audit log: admins only
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Server member roles
CREATE POLICY "Member roles viewable" ON public.server_member_roles FOR SELECT TO authenticated USING (true);

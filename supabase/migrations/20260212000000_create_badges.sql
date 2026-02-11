-- Create badges table if not exists
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_badges table if not exists
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
  ('VIP', '💎', 'Very Important Person'),
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

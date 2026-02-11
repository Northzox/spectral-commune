import { supabase } from "@/integrations/supabase/client";

export const ADMIN_EMAILS = ['northlable69@gmail.com'];

export async function checkIsAdmin(userId: string): Promise<boolean> {
  // First check by role in database
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  
  if (data) return true;
  
  // Fallback: check by email for hardcoded admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
    
  return profile ? ADMIN_EMAILS.includes(profile.email) : false;
}

export async function getCurrentProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

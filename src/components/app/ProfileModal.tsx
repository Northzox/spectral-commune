import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Shield, User, Calendar, Mail, MapPin, Link2, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ProfileData {
  id: string;
  username: string;
  bio: string | null;
  custom_status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  profile_color: string | null;
  created_at: string;
  user_badges?: Array<{
    badges: {
      id: string;
      name: string;
      icon: string;
      description: string;
    };
  }>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  isOwnProfile?: boolean;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  moderator: Shield,
  member: User
};

const roleColors = {
  owner: 'text-yellow-500',
  admin: 'text-purple-500',
  moderator: 'text-blue-500',
  member: 'text-gray-400'
};

export default function ProfileModal({ open, onOpenChange, userId, isOwnProfile = false }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [memberRole, setMemberRole] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !open) return;
    fetchProfile();
  }, [userId, open]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select(`
          *,
          user_badges (
            badges (
              id,
              name,
              icon,
              description
            )
          )
        `)
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get member role if in a server context
      const { data: memberData } = await supabase
        .from('server_members')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (memberData) {
        setMemberRole(memberData.role);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh]">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!profile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh]">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const RoleIcon = memberRole ? roleIcons[memberRole as keyof typeof roleIcons] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] p-0">
        <div className="h-full flex flex-col">
          {/* Banner */}
          <div 
            className="h-32 bg-cover bg-center relative"
            style={{ 
              backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
              backgroundColor: profile.profile_color || '#5865F2' 
            }}
          >
            {!profile.banner_url && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="flex-1 flex flex-col">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="font-display text-xl">
                {isOwnProfile ? 'My Profile' : `${profile.username}'s Profile`}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 pb-6">
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-card">
                      <AvatarImage src={profile.avatar_url || ''} />
                      <AvatarFallback 
                        className="text-2xl" 
                        style={{ backgroundColor: profile.profile_color || '#5865F2' }}
                      >
                        {profile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {memberRole && RoleIcon && (
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center`}>
                        <RoleIcon className={`w-3 h-3 ${roleColors[memberRole as keyof typeof roleColors]}`} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold">{profile.username}</h2>
                      {memberRole && (
                        <Badge variant="secondary" className="capitalize">
                          {memberRole}
                        </Badge>
                      )}
                    </div>
                    
                    {profile.custom_status && (
                      <p className="text-muted-foreground italic mb-2">{profile.custom_status}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                {profile.user_badges && profile.user_badges.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.user_badges.map((userBadge) => (
                        <div 
                          key={userBadge.badges.id}
                          className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full"
                          title={userBadge.badges.description}
                        >
                          <span className="text-lg">{userBadge.badges.icon}</span>
                          <span className="text-sm font-medium">{userBadge.badges.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {profile.bio && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">About</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}

                {/* Profile Color */}
                {profile.profile_color && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Profile Theme</h3>
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-border"
                        style={{ backgroundColor: profile.profile_color }}
                      />
                      <span className="text-sm text-muted-foreground">{profile.profile_color}</span>
                    </div>
                  </div>
                )}

                {/* Private Information Notice */}
                {!isOwnProfile && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Personal information like email and private details are hidden for privacy.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

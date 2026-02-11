import { useState, useEffect } from 'react';
import { Users, Crown, Shield, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ProfileModal from './ProfileModal';
import { toast } from 'sonner';

interface ServerMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joined_at: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
    presence: string;
    custom_status: string | null;
    user_badges?: Array<{
      badges: {
        id: string;
        name: string;
        icon: string;
        description: string;
      };
    }>;
  };
}

interface Props {
  serverId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  asSidebar?: boolean;
}

const roleHierarchy = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1
};

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

export default function ServerMemberList({ serverId, open = true, onOpenChange, asSidebar = false }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ServerMember | null>(null);
  const [newRole, setNewRole] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId || (!asSidebar && !open)) return;
    
    const fetchMembers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('server_members')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            presence,
            custom_status
          ),
          user_badges:user_id (
            badges (
              id,
              name,
              icon,
              description
            )
          )
        `)
        .eq('server_id', serverId)
        .order('joined_at', { ascending: true });
      
      if (data) {
        setMembers(data.sort((a, b) => {
          const roleDiff = roleHierarchy[b.role] - roleHierarchy[a.role];
          if (roleDiff !== 0) return roleDiff;
          return a.profiles.username.localeCompare(b.profiles.username);
        }));
      }
      setLoading(false);
    };

    fetchMembers();
  }, [serverId, open, asSidebar]);

  const handleProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  const handleRoleChange = async () => {
    if (!selectedMember || !newRole) return;

    const { error } = await supabase
      .from('server_members')
      .update({ role: newRole })
      .eq('id', selectedMember.id);

    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success('Role updated successfully');
      setMembers(prev => prev.map(m => 
        m.id === selectedMember.id ? { ...m, role: newRole as any } : m
      ).sort((a, b) => {
        const roleDiff = roleHierarchy[b.role] - roleHierarchy[a.role];
        if (roleDiff !== 0) return roleDiff;
        return a.profiles.username.localeCompare(b.profiles.username);
      }));
      setShowRoleDialog(false);
      setSelectedMember(null);
      setNewRole('');
    }
  };

  const canManageRoles = members.some(m => 
    m.user_id === user?.id && ['owner', 'admin'].includes(m.role)
  );

  const getPresenceColor = (presence: string) => {
    switch (presence) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {asSidebar ? (
        <div className="h-full flex flex-col">
          <div className="h-12 px-4 flex items-center justify-between border-b border-border">
            <span className="font-semibold text-sm">Server Members — {members.length}</span>
          </div>
          
          <ScrollArea className="flex-1 p-2">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading members...</div>
            ) : (
              <div className="space-y-1">
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role];
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                      onClick={() => handleProfileClick(member.profiles.id)}
                    >
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.profiles.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {member.profiles.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${getPresenceColor(member.profiles.presence)}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{member.profiles.username}</p>
                          <RoleIcon className={`w-3.5 h-3.5 ${roleColors[member.role]}`} />
                        </div>
                        {member.profiles.user_badges && member.profiles.user_badges.length > 0 && (
                          <div className="flex gap-1">
                            {member.profiles.user_badges.map((userBadge, index) => (
                              <div key={userBadge.badges.id} className="text-lg" title={userBadge.badges.description}>
                                {userBadge.badges.icon}
                              </div>
                            ))}
                          </div>
                        )}
                        {member.profiles.custom_status && (
                          <p className="text-xs text-muted-foreground truncate">{member.profiles.custom_status}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="bg-card border-border max-w-md max-h-[600px]">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                Server Members
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading members...</div>
              ) : (
                <div className="space-y-1">
                  {members.map((member) => {
                    const RoleIcon = roleIcons[member.role];
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
                        onClick={() => handleProfileClick(member.profiles.id)}
                      >
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={member.profiles.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {member.profiles.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${getPresenceColor(member.profiles.presence)}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{member.profiles.username}</p>
                            <RoleIcon className={`w-3.5 h-3.5 ${roleColors[member.role]}`} />
                          </div>
                          {member.profiles.user_badges && member.profiles.user_badges.length > 0 && (
                            <div className="flex gap-1">
                              {member.profiles.user_badges.map((userBadge, index) => (
                                <div key={userBadge.badges.id} className="text-lg" title={userBadge.badges.description}>
                                  {userBadge.badges.icon}
                                </div>
                              ))}
                            </div>
                          )}
                          {member.profiles.custom_status && (
                            <p className="text-xs text-muted-foreground truncate">{member.profiles.custom_status}</p>
                          )}
                        </div>
                        
                        {canManageRoles && member.user_id !== user?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedMember(member);
                              setNewRole(member.role);
                              setShowRoleDialog(true);
                            }}
                          >
                            <span className="text-xs capitalize">{member.role}</span>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedMember.profiles.avatar_url || ''} />
                  <AvatarFallback>
                    {selectedMember.profiles.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedMember.profiles.username}</p>
                  <p className="text-sm text-muted-foreground">Current role: {selectedMember.role}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleRoleChange} className="flex-1">
                  Update Role
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProfileModal 
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        userId={selectedUserId || ''}
        isOwnProfile={selectedUserId === user?.id}
      />
    </>
  );
}

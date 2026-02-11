import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings, 
  Hash, 
  Volume2, 
  Megaphone, 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  FolderPlus,
  Users,
  Crown,
  Shield,
  User,
  Upload,
  Check,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement' | 'forum';
  category_id: string | null;
  position: number;
  topic?: string;
}

interface Category {
  id: string;
  name: string;
  position: number;
}

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
  };
}

interface CustomRole {
  id: string;
  name: string;
  color: string;
  permissions: {
    manage_server: boolean;
    manage_channels: boolean;
    manage_roles: boolean;
    kick_members: boolean;
    ban_members: boolean;
    send_messages: boolean;
    connect_voice: boolean;
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  serverName: string;
  onServerUpdate?: () => void;
}

const channelTypes = [
  { value: 'text', label: 'Text Channel', icon: Hash },
  { value: 'voice', label: 'Voice Channel', icon: Volume2 },
  { value: 'announcement', label: 'Announcement', icon: Megaphone },
  { value: 'forum', label: 'Forum', icon: MessageSquare },
];

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

export default function ServerManagementPanel({ open, onOpenChange, serverId, serverName, onServerUpdate }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'roles' | 'members'>('overview');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [serverSettings, setServerSettings] = useState({ 
    name: serverName, 
    description: '',
    icon_url: '',
    banner_url: ''
  });
  const [newChannel, setNewChannel] = useState({ name: '', type: 'text' as const, categoryId: '', topic: '' });
  const [newCategory, setNewCategory] = useState({ name: '' });
  const [newRole, setNewRole] = useState({ 
    name: '', 
    color: '#5865F2',
    permissions: {
      manage_server: false,
      manage_channels: false,
      manage_roles: false,
      kick_members: false,
      ban_members: false,
      send_messages: true,
      connect_voice: true
    }
  });
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!serverId || !open) return;
    fetchData();
  }, [serverId, open]);

  const fetchData = async () => {
    setLoading(true);
    const [channelsRes, categoriesRes, membersRes, serverRes] = await Promise.all([
      supabase.from('channels').select('*').eq('server_id', serverId).order('position'),
      supabase.from('channel_categories').select('*').eq('server_id', serverId).order('position'),
      supabase.from('server_members').select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url,
          presence
        )
      `).eq('server_id', serverId).order('joined_at'),
      supabase.from('servers').select('name, description').eq('id', serverId).single()
    ]);

    if (channelsRes.data) setChannels(channelsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (membersRes.data) setMembers(membersRes.data);
    if (serverRes.data) setServerSettings({ name: serverRes.data.name, description: serverRes.data.description || '' });
    setLoading(false);
  };

  const handleSaveServerSettings = async () => {
    const { error } = await supabase
      .from('servers')
      .update({ 
        name: serverSettings.name, 
        description: serverSettings.description,
        icon_url: serverSettings.icon_url,
        banner_url: serverSettings.banner_url
      })
      .eq('id', serverId);

    if (error) {
      toast.error('Failed to update server settings');
    } else {
      toast.success('Server settings updated');
      onServerUpdate?.();
      onOpenChange(false);
    }
  };

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${serverId}/icon.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('server_images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload icon');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('server_images')
      .getPublicUrl(fileName);

    setServerSettings(prev => ({ ...prev, icon_url: publicUrl }));
    toast.success('Icon uploaded');
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${serverId}/banner.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('server_images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Failed to upload banner');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('server_images')
      .getPublicUrl(fileName);

    setServerSettings(prev => ({ ...prev, banner_url: publicUrl }));
    toast.success('Banner uploaded');
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    const { error } = await supabase
      .from('custom_roles')
      .insert({
        server_id: serverId,
        name: newRole.name,
        color: newRole.color,
        permissions: newRole.permissions
      });

    if (error) {
      toast.error('Failed to create role');
    } else {
      toast.success('Role created');
      setNewRole({ 
        name: '', 
        color: '#5865F2',
        permissions: {
          manage_server: false,
          manage_channels: false,
          manage_roles: false,
          kick_members: false,
          ban_members: false,
          send_messages: true,
          connect_voice: true
        }
      });
      fetchData();
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) {
      toast.error('Channel name is required');
      return;
    }

    const { error } = await supabase.from('channels').insert({
      server_id: serverId,
      name: newChannel.name.trim(),
      type: newChannel.type,
      category_id: newChannel.categoryId || null,
      topic: newChannel.topic.trim(),
      position: channels.length
    });

    if (error) {
      toast.error('Failed to create channel');
    } else {
      toast.success('Channel created');
      setNewChannel({ name: '', type: 'text', categoryId: '', topic: '' });
      fetchData();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    const { error } = await supabase.from('channel_categories').insert({
      server_id: serverId,
      name: newCategory.name.trim(),
      position: categories.length
    });

    if (error) {
      toast.error('Failed to create category');
    } else {
      toast.success('Category created');
      setNewCategory({ name: '' });
      fetchData();
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    const { error } = await supabase.from('channels').delete().eq('id', channelId);
    if (error) {
      toast.error('Failed to delete channel');
    } else {
      toast.success('Channel deleted');
      fetchData();
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase.from('channel_categories').delete().eq('id', categoryId);
    if (error) {
      toast.error('Failed to delete category');
    } else {
      toast.success('Category deleted');
      fetchData();
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from('server_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success('Role updated');
      fetchData();
    }
  };

  const getChannelIcon = (type: string) => {
    const channelType = channelTypes.find(t => t.value === type);
    return channelType?.icon || Hash;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Server Management — {serverName}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'channels', label: 'Channels' },
            { id: 'roles', label: 'Roles' },
            { id: 'members', label: 'Members' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Server Settings</h3>
                <div className="space-y-2">
                  <Label htmlFor="server-name">Server Name</Label>
                  <Input
                    id="server-name"
                    value={serverSettings.name}
                    onChange={e => setServerSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Server Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="server-description">Description</Label>
                  <Textarea
                    id="server-description"
                    value={serverSettings.description}
                    onChange={e => setServerSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your server..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveServerSettings} className="w-full">
                  Save Server Settings
                </Button>
              </div>
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              {/* Create Category */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FolderPlus className="w-5 h-5" />
                  Create Category
                </h3>
                <div className="flex gap-2">
                  <Input
                    value={newCategory.name}
                    onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Category name"
                    className="flex-1"
                  />
                  <Button onClick={handleCreateCategory}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Create Channel */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Channel
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Channel Name</Label>
                    <Input
                      value={newChannel.name}
                      onChange={e => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="channel-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel Type</Label>
                    <Select value={newChannel.type} onValueChange={(value: any) => setNewChannel(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {channelTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newChannel.categoryId} onValueChange={value => setNewChannel(prev => ({ ...prev, categoryId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="No category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No category</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Topic (Optional)</Label>
                    <Input
                      value={newChannel.topic}
                      onChange={e => setNewChannel(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="Channel topic..."
                    />
                  </div>
                </div>
                <Button onClick={handleCreateChannel} className="w-full">
                  Create Channel
                </Button>
              </div>

              {/* Existing Categories and Channels */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Existing Channels</h3>
                {categories.map(category => {
                  const categoryChannels = channels.filter(ch => ch.category_id === category.id);
                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {categoryChannels.map(channel => {
                        const Icon = getChannelIcon(channel.type);
                        return (
                          <div key={channel.id} className="flex items-center justify-between p-2 bg-card border rounded ml-4">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <span>{channel.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {channel.type}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteChannel(channel.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Uncategorized channels */}
                {channels.filter(ch => !ch.category_id).map(channel => {
                  const Icon = getChannelIcon(channel.type);
                  return (
                    <div key={channel.id} className="flex items-center justify-between p-2 bg-card border rounded">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span>{channel.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {channel.type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChannel(channel.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Role Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Owner', icon: Crown, color: 'text-yellow-500', description: 'Server owner' },
                  { name: 'Admin', icon: Shield, color: 'text-purple-500', description: 'Server administrator' },
                  { name: 'Moderator', icon: Shield, color: 'text-blue-500', description: 'Community moderator' },
                  { name: 'Member', icon: User, color: 'text-gray-400', description: 'Regular member' },
                ].map(role => (
                  <div key={role.name} className="p-4 bg-card border rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <role.icon className={`w-5 h-5 ${role.color}`} />
                      <span className="font-medium">{role.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Server Members ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map(member => {
                  const RoleIcon = roleIcons[member.role];
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                          {member.profiles.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{member.profiles.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RoleIcon className={`w-4 h-4 ${roleColors[member.role]}`} />
                        <Select
                          value={member.role}
                          onValueChange={(value: any) => handleRoleChange(member.id, value)}
                        >
                          <SelectTrigger className="w-24">
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
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

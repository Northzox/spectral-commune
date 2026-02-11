import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Hash, MessageSquare, Settings, Plus, Crown, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ServerMemberList from '@/components/app/ServerMemberList';
import ProfileModal from '@/components/app/ProfileModal';
import { toast } from 'sonner';

interface Server {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  created_at: string;
}

interface DirectMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [servers, setServers] = useState<Server[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's servers
      const { data: serverData } = await supabase
        .from('server_members')
        .select(`
          servers (
            id,
            name,
            description,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (serverData) {
        const serversWithCounts = await Promise.all(
          serverData.map(async (member) => {
            const { count } = await supabase
              .from('server_members')
              .select('*', { count: 'exact', head: true })
              .eq('server_id', member.servers.id);
            
            return {
              ...member.servers,
              member_count: count || 0
            };
          })
        );
        setServers(serversWithCounts);
      }

      // Fetch direct messages (mock data for now)
      setDirectMessages([
        {
          id: '1',
          user_id: 'user1',
          username: 'Alice',
          avatar_url: null,
          last_message: 'Hey, how are you?',
          last_message_time: '2h ago'
        },
        {
          id: '2',
          user_id: 'user2',
          username: 'Bob',
          avatar_url: null,
          last_message: 'See you tomorrow!',
          last_message_time: '1d ago'
        }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
    setLoading(false);
  };

  const filteredServers = servers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  const handlePresenceChange = async (presence: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ presence })
      .eq('id', user?.id);

    if (error) {
      toast.error('Failed to update presence');
    } else {
      toast.success('Presence updated');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-primary font-display font-bold text-2xl">H</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">H</span>
              </div>
              <h1 className="text-xl font-bold">Haunted Cord</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search servers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <select
                  onChange={(e) => handlePresenceChange(e.target.value)}
                  className="bg-muted border border-border rounded px-2 py-1 text-sm"
                  defaultValue="online"
                >
                  <option value="online">🟢 Online</option>
                  <option value="idle">🟡 Idle</option>
                  <option value="dnd">🔴 Do Not Disturb</option>
                  <option value="offline">⚫ Offline</option>
                </select>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleProfileClick(user?.id || '')}
                className="flex items-center gap-2"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">Profile</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Servers Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Servers</h2>
              <Button onClick={() => navigate('/app')}>
                <Plus className="w-4 h-4 mr-2" />
                Browse All Servers
              </Button>
            </div>

            {filteredServers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Hash className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No servers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term' : 'Join or create your first server'}
                  </p>
                  <Button onClick={() => navigate('/app')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Server
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredServers.map((server) => (
                  <Card key={server.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <span className="text-primary font-display font-bold text-xl">
                            {server.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <Badge variant="secondary">{server.member_count} members</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-lg mb-2">{server.name}</CardTitle>
                      <p className="text-muted-foreground text-sm mb-4">
                        {server.description || 'No description'}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/app?server=${server.id}`)}
                        >
                          Open Server
                        </Button>
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Direct Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Direct Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {directMessages.map((dm) => (
                      <div
                        key={dm.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleProfileClick(dm.user_id)}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={dm.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {dm.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{dm.username}</p>
                          <p className="text-xs text-muted-foreground truncate">{dm.last_message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{dm.last_message_time}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Server
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/friends')}>
                  <Users className="w-4 h-4 mr-2" />
                  Add Friends
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        userId={selectedUserId || ''}
        isOwnProfile={selectedUserId === user?.id}
      />
    </div>
  );
}

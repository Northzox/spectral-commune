import { useState, useEffect } from 'react';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface DMConversation {
  id: string;
  other_user_id: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
    presence: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  presence: string;
}

interface Props {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export default function DMSidebar({ activeConversationId, onSelectConversation }: Props) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDM, setShowNewDM] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('dm_conversations')
        .select(`
          *,
          other_user:other_user_id(id, username, avatar_url, presence),
          last_message:dm_messages(content, created_at)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (data) {
        setConversations(data);
      }
    };

    fetchConversations();

    // Subscribe to new messages
    const subscription = supabase
      .channel('dm_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'dm_conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, presence')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user?.id || '')
        .limit(10);

      if (data) {
        setSearchResults(data);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

  const startDM = async (otherUserId: string) => {
    if (!user) return;

    setLoading(true);

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('dm_conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('other_user_id', otherUserId)
        .single();

      if (existing) {
        onSelectConversation(existing.id);
        setShowNewDM(false);
        setSearchQuery('');
        setSearchResults([]);
        setLoading(false);
        return;
      }

      // Create new conversation
      const { data: conversation, error } = await supabase
        .from('dm_conversations')
        .insert({
          user_id: user.id,
          other_user_id: otherUserId
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (conversation) {
        toast.success('DM conversation started!');
        onSelectConversation(conversation.id);
        setShowNewDM(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('DM creation error:', error);
      toast.error('Failed to start DM');
    }

    setLoading(false);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPresenceColor = (presence: string) => {
    switch (presence) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-60 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border">
        <span className="font-semibold text-sm">Direct Messages</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowNewDM(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Find or start a conversation"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {searchResults.map(searchUser => (
              <button
                key={searchUser.id}
                onClick={() => startDM(searchUser.id)}
                className="w-full flex items-center gap-3 p-2 hover:bg-surface-hover transition-colors"
                disabled={loading}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={searchUser.avatar_url || ''} />
                    <AvatarFallback>
                      {searchUser.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${getPresenceColor(searchUser.presence)}`} />
                </div>
                <span className="text-sm font-medium">{searchUser.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map(conversation => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors ${
              activeConversationId === conversation.id ? 'bg-surface-active' : ''
            }`}
          >
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={conversation.other_user.avatar_url || ''} />
                <AvatarFallback>
                  {conversation.other_user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${getPresenceColor(conversation.other_user.presence)}`} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">
                  {conversation.other_user.username}
                </span>
                {conversation.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatMessageTime(conversation.last_message.created_at)}
                  </span>
                )}
              </div>
              {conversation.last_message && (
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.last_message.content}
                </p>
              )}
            </div>
          </button>
        ))}
        
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mb-2" />
            <p className="text-sm">No DMs yet</p>
            <p className="text-xs">Click the + button to start one</p>
          </div>
        )}
      </div>

      {/* New DM Dialog */}
      <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a DM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for a user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.map(searchUser => (
                  <button
                    key={searchUser.id}
                    onClick={() => startDM(searchUser.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-surface-hover transition-colors"
                    disabled={loading}
                  >
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={searchUser.avatar_url || ''} />
                        <AvatarFallback>
                          {searchUser.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${getPresenceColor(searchUser.presence)}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{searchUser.username}</p>
                      <p className="text-sm text-muted-foreground capitalize">{searchUser.presence}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {searchQuery && searchResults.length === 0 && (
              <p className="text-center text-muted-foreground">No users found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

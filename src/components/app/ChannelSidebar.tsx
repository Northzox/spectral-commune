import { useState, useEffect } from 'react';
import { Hash, Volume2, Megaphone, MessageSquare, ChevronDown, Plus, Settings, FolderPlus, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ServerSettingsDialog from './ServerSettingsDialog';
import CreateChannelDialog from './CreateChannelDialog';
import CreateCategoryDialog from './CreateCategoryDialog';
import InviteDialog from './InviteDialog';
import ServerMemberList from './ServerMemberList';

interface Channel {
  id: string;
  name: string;
  type: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Props {
  serverId: string;
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  serverName: string;
}

export default function ChannelSidebar({ serverId, activeChannelId, onSelectChannel, serverName }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const [catRes, chanRes] = await Promise.all([
        supabase.from('channel_categories').select('*').eq('server_id', serverId).order('position'),
        supabase.from('channels').select('*').eq('server_id', serverId).order('position'),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (chanRes.data) {
        setChannels(chanRes.data as Channel[]);
        if (chanRes.data.length > 0 && !activeChannelId) {
          onSelectChannel(chanRes.data[0].id);
        }
      }
    };
    fetch();
  }, [serverId]);

  const channelIcon = (type: string) => {
    switch (type) {
      case 'voice': return Volume2;
      case 'announcement': return Megaphone;
      case 'forum': return MessageSquare;
      default: return Hash;
    }
  };

  return (
    <div className="w-60 bg-card border-r border-border flex flex-col">
      {/* Server header */}
      <div 
        className="h-12 px-4 flex items-center justify-between border-b border-border hover:bg-surface-hover transition-colors cursor-pointer"
        onClick={() => setShowSettings(true)}
      >
        <span className="font-semibold text-sm truncate">{serverName}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {categories.map(cat => {
          const catChannels = channels.filter(c => c.category_id === cat.id);
          return (
            <div key={cat.id}>
              <button className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground w-full px-1 mb-1">
                <ChevronDown className="w-3 h-3" />
                {cat.name}
              </button>
              {catChannels.map(ch => {
                const Icon = channelIcon(ch.type);
                return (
                  <button
                    key={ch.id}
                    onClick={() => onSelectChannel(ch.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      activeChannelId === ch.id
                        ? 'bg-surface-active text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-channel-icon shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
        {/* Uncategorized */}
        {channels.filter(c => !c.category_id).map(ch => {
          const Icon = channelIcon(ch.type);
          return (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                activeChannelId === ch.id
                  ? 'bg-surface-active text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <Icon className="w-4 h-4 text-channel-icon shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="p-2 border-t border-border space-y-2">
        <button
          onClick={() => setShowCreateChannel(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Channel
        </button>
        <button
          onClick={() => setShowCreateCategory(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          Create Category
        </button>
        <button
          onClick={() => setShowInvite(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite People
        </button>
        <button
          onClick={() => setShowMembers(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Users className="w-4 h-4" />
          Server Members
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        >
          <Settings className="w-4 h-4" />
          Server Settings
        </button>
      </div>

      <ServerSettingsDialog 
        open={showSettings} 
        onOpenChange={setShowSettings} 
        serverId={serverId}
        onUpdated={() => {
          // Refresh server data if needed
        }}
      />
      
      <CreateChannelDialog 
        open={showCreateChannel} 
        onOpenChange={setShowCreateChannel} 
        serverId={serverId}
        onCreated={() => {
          // Refresh channels
          const fetch = async () => {
            const [catRes, chanRes] = await Promise.all([
              supabase.from('channel_categories').select('*').eq('server_id', serverId).order('position'),
              supabase.from('channels').select('*').eq('server_id', serverId).order('position'),
            ]);
            if (catRes.data) setCategories(catRes.data);
            if (chanRes.data) setChannels(chanRes.data as Channel[]);
          };
          fetch();
        }}
      />

      <CreateCategoryDialog 
        open={showCreateCategory} 
        onOpenChange={setShowCreateCategory} 
        serverId={serverId}
        onCreated={() => {
          // Refresh categories
          const fetch = async () => {
            const [catRes, chanRes] = await Promise.all([
              supabase.from('channel_categories').select('*').eq('server_id', serverId).order('position'),
              supabase.from('channels').select('*').eq('server_id', serverId).order('position'),
            ]);
            if (catRes.data) setCategories(catRes.data);
            if (chanRes.data) setChannels(chanRes.data as Channel[]);
          };
          fetch();
        }}
      />

      <InviteDialog 
        open={showInvite} 
        onOpenChange={setShowInvite} 
        serverId={serverId}
      />

      <ServerMemberList 
        open={showMembers}
        onOpenChange={setShowMembers}
        serverId={serverId}
      />
    </div>
  );
}

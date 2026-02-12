import { useState, useEffect } from 'react';
import { Hash, Volume2, Megaphone, MessageSquare, ChevronDown, Plus, Settings, FolderPlus, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ServerSettingsDialog from './ServerSettingsDialog';
import CreateChannelDialog from './CreateChannelDialog';
import CreateCategoryDialog from './CreateCategoryDialog';
import InviteDialog from './InviteDialog';
import ServerMemberList from './ServerMemberList';
import ServerManagementPanel from './ServerManagementPanel';

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
  onSelectChannel: (channelId: string) => void;
  serverName: string;
  onServerUpdate?: () => void;
  onServerDeleted?: () => void;
}

export default function ChannelSidebar({ serverId, activeChannelId, onSelectChannel, serverName, onServerUpdate, onServerDeleted }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showManagement, setShowManagement] = useState(false);

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
    <div className="w-60 bg-[#2b2d31] text-gray-300 flex flex-col">
      {/* Server Header */}
      <div 
        className="h-12 px-4 flex items-center justify-between border-b border-[#1f1f23] shadow-sm cursor-pointer hover:bg-[#36393f] transition-colors"
        onClick={() => setShowManagement(true)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#5865f2] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">
              {serverName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-semibold text-white text-sm">{serverName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-[#4f545c] transition-colors">
            <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#4f545c] transition-colors">
            <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Channel Categories and Channels */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#202225]">
        {categories.map(category => {
          const catChannels = channels.filter(c => c.category_id === category.id);
          const [isCollapsed, setIsCollapsed] = useState(true);
          
          return (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <button
                className="w-full px-2 py-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-white transition-colors"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronDown 
                  className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
                />
                {category.name}
                <span className="ml-auto text-xs text-gray-500">
                  {catChannels.length}
                </span>
              </button>

              {/* Channel List */}
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {catChannels.map(channel => {
                    const Icon = channelIcon(channel.type);
                    const isActive = activeChannelId === channel.id;
                    
                    return (
                      <button
                        key={channel.id}
                        className={`w-full px-2 py-1.5 flex items-center gap-2 text-sm rounded transition-all ${
                          isActive 
                            ? 'bg-[#4f545c] text-white' 
                            : 'text-gray-400 hover:bg-[#4f545c] hover:text-white'
                        }`}
                        onClick={() => onSelectChannel(channel.id)}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        <span className="flex-1 text-left">{channel.name}</span>
                        {channel.type === 'announcement' && (
                          <Megaphone className="w-3 h-3 text-yellow-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {/* No Categories - Show channels directly */}
        {categories.length === 0 && (
          <div className="px-2 py-2 space-y-0.5">
            {channels.map(channel => {
              const Icon = channelIcon(channel.type);
              const isActive = activeChannelId === channel.id;
              
              return (
                <button
                  key={channel.id}
                  className={`w-full px-2 py-1.5 flex items-center gap-2 text-sm rounded transition-all ${
                    isActive 
                      ? 'bg-[#4f545c] text-white' 
                      : 'text-gray-400 hover:bg-[#4f545c] hover:text-white'
                  }`}
                  onClick={() => onSelectChannel(channel.id)}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="flex-1 text-left">{channel.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Voice Channels Section */}
        {channels.some(c => c.type === 'voice') && (
          <div className="mt-4 mb-2">
            <div className="px-2 py-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Volume2 className="w-3 h-3" />
              Voice Channels
            </div>
            <div className="mt-1 space-y-0.5">
              {channels.filter(c => c.type === 'voice').map(channel => (
                <div
                  key={channel.id}
                  className="px-2 py-1.5 flex items-center gap-2 text-sm text-gray-400"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>{channel.name}</span>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Area */}
      <div className="h-14 px-2 flex items-center gap-2 border-t border-[#1f1f23] bg-[#292b2f]">
        <div className="w-8 h-8 rounded-full bg-[#7289da] flex items-center justify-center">
          <span className="text-white text-xs font-bold">U</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">Your Name</p>
          <p className="text-xs text-gray-500">#general</p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-[#4f545c] transition-colors">
            <Mic className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#4f545c] transition-colors">
            <Headphones className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#4f545c] transition-colors">
            <Settings className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <ServerManagementPanel 
        open={showSettings} 
        onOpenChange={setShowSettings} 
        serverId={serverId}
        onUpdated={() => {
          // Refresh server data if needed
        }}
        onDeleted={() => {
          onServerDeleted?.();
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
              supabase.from('channel_categories').select('*').eq('server_id', serverId),
              supabase.from('channels').select('*').eq('server_id', serverId)
            ]);
            if (catRes.data) setCategories(catRes.data);
            if (chanRes.data) setChannels(chanRes.data);
          };
          fetch();
        }}
      />
      
      <CreateCategoryDialog 
        open={showCreateCategory} 
        onOpenChange={setShowCreateCategory} 
        serverId={serverId}
        onCreated={() => {
          // Refresh categories and channels
          const fetch = async () => {
            const [catRes, chanRes] = await Promise.all([
              supabase.from('channel_categories').select('*').eq('server_id', serverId),
              supabase.from('channels').select('*').eq('server_id', serverId)
            ]);
            if (catRes.data) setCategories(catRes.data);
            if (chanRes.data) setChannels(chanRes.data);
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
      
      <ServerManagementPanel 
        open={showManagement}
        onOpenChange={setShowManagement}
        serverId={serverId}
        serverName={serverName}
        onServerUpdate={onServerUpdate}
        onServerDeleted={onServerDeleted}
      />
    </div>
  );
}

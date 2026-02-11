import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ServerSidebar from '@/components/app/ServerSidebar';
import ChannelSidebar from '@/components/app/ChannelSidebar';
import ChatArea from '@/components/app/ChatArea';
import UserPanel from '@/components/app/UserPanel';
import ServerMemberList from '@/components/app/ServerMemberList';
import { supabase } from '@/integrations/supabase/client';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [serverName, setServerName] = useState('');
  const [channelName, setChannelName] = useState('');

  const handleServerUpdate = () => {
    // Refresh server data
    if (activeServerId) {
      fetchServerData();
    }
  };

  const fetchServerData = async () => {
    if (!activeServerId) return;
    
    const { data } = await supabase
      .from('servers')
      .select('name')
      .eq('id', activeServerId)
      .single();
    
    if (data) {
      setServerName(data.name);
    }
  };

  useEffect(() => {
    if (!activeServerId) return;
    fetchServerData();
    setActiveChannelId(null);
  }, [activeServerId]);

  useEffect(() => {
    if (!activeChannelId) return;
    supabase.from('channels').select('name').eq('id', activeChannelId).single().then(({ data }) => {
      if (data) setChannelName(data.name);
    });
  }, [activeChannelId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center animate-pulse-glow">
          <span className="text-primary font-display font-bold">H</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <ServerSidebar activeServerId={activeServerId} onSelectServer={setActiveServerId} />
      
      {activeServerId ? (
        <>
          <div className="flex flex-col">
            <ChannelSidebar
              serverId={activeServerId}
              activeChannelId={activeChannelId}
              onSelectChannel={setActiveChannelId}
              serverName={serverName}
              onServerUpdate={handleServerUpdate}
            />
            <UserPanel />
          </div>
          {activeChannelId ? (
            <ChatArea channelId={activeChannelId} channelName={channelName} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Select a channel to start chatting</p>
            </div>
          )}
          <div className="w-60 bg-card border-l border-border">
            <ServerMemberList 
              open={true}
              onOpenChange={() => {}}
              serverId={activeServerId}
              asSidebar={true}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-display font-bold text-2xl">H</span>
            </div>
            <p className="font-display text-lg">Create or join a server to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

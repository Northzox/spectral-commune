import { useState, useEffect } from 'react';
import { Plus, Compass } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CreateServerDialog from './CreateServerDialog';

interface Server {
  id: string;
  name: string;
  icon_url: string | null;
}

interface ServerSidebarProps {
  activeServerId: string | null;
  onSelectServer: (id: string) => void;
}

export default function ServerSidebar({ activeServerId, onSelectServer }: ServerSidebarProps) {
  const { user } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchServers = async () => {
      const { data } = await supabase
        .from('server_members')
        .select('server_id, servers:server_id(id, name, icon_url)')
        .eq('user_id', user.id);
      if (data) {
        const s = data.map((d: any) => d.servers).filter(Boolean);
        setServers(s);
        if (s.length > 0 && !activeServerId) {
          onSelectServer(s[0].id);
        }
      }
    };
    fetchServers();
  }, [user]);

  return (
    <div className="w-[72px] bg-sidebar flex flex-col items-center py-3 gap-2 border-r border-sidebar-border overflow-y-auto">
      {/* Home */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:rounded-xl hover:bg-primary transition-all duration-200">
            <Compass className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Home</TooltipContent>
      </Tooltip>

      <div className="w-8 h-[2px] bg-border rounded-full" />

      {/* Server list */}
      {servers.map(server => (
        <Tooltip key={server.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectServer(server.id)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-semibold transition-all duration-200 hover:rounded-xl ${
                activeServerId === server.id
                  ? 'bg-primary rounded-xl text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-primary/80 hover:text-primary-foreground'
              }`}
            >
              {server.icon_url ? (
                <img src={server.icon_url} alt="" className="w-full h-full rounded-inherit object-cover" />
              ) : (
                server.name.charAt(0).toUpperCase()
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{server.name}</TooltipContent>
        </Tooltip>
      ))}

      {/* Add server */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setShowCreate(true)}
            className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center hover:rounded-xl hover:bg-online hover:text-primary-foreground transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Create Server</TooltipContent>
      </Tooltip>

      <CreateServerDialog open={showCreate} onOpenChange={setShowCreate} onCreated={(id) => {
        onSelectServer(id);
        setShowCreate(false);
      }} />
    </div>
  );
}

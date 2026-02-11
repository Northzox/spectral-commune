import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Settings, Mic, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function UserPanel() {
  const { user, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username').eq('id', user.id).single().then(({ data }) => {
      if (data) setUsername(data.username);
    });
  }, [user]);

  return (
    <div className="h-[52px] bg-sidebar px-2 flex items-center gap-2 border-t border-sidebar-border">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold">{username.charAt(0).toUpperCase() || '?'}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{username || 'Loading...'}</p>
          <p className="text-[10px] text-online">Online</p>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1.5 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Mute</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1.5 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors">
              <Headphones className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Deafen</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => navigate('/settings')}
              className="p-1.5 rounded hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Hash, Plus, Smile, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null };
}

interface Props {
  channelId: string;
  channelName: string;
}

export default function ChatArea({ channelId, channelName }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles:author_id(username, avatar_url)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data as any);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', payload.new.author_id)
          .single();
        setMessages(prev => [...prev, { ...payload.new as any, profiles: profile }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || sending) return;
    setSending(true);
    await supabase.from('messages').insert({
      channel_id: channelId,
      author_id: user.id,
      content: input.trim(),
    });
    setInput('');
    setSending(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Channel header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-border shrink-0">
        <Hash className="w-5 h-5 text-channel-icon" />
        <span className="font-semibold text-sm">{channelName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <Hash className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold">Welcome to #{channelName}</p>
            <p className="text-sm">This is the start of the channel.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-3 group hover:bg-surface-hover rounded-md px-2 py-1 -mx-2 transition-colors">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
              {msg.profiles?.avatar_url ? (
                <img src={msg.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">
                  {(msg.profiles?.username || '?').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-foreground">{msg.profiles?.username || 'Unknown'}</span>
                <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/90 break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-input rounded-lg px-4 py-2.5 border border-border focus-within:border-primary/50 transition-colors">
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Message #${channelName}`}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <button 
            type="submit" 
            disabled={!input.trim() || sending}
            className="text-primary hover:text-primary/80 disabled:opacity-30 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

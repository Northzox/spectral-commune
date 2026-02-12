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
    <div className="flex-1 flex flex-col bg-[#36393f]">
      {/* Channel Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225] shadow-sm">
        <div className="flex items-center gap-2">
          <Hash className="w-5 h-5 text-gray-400" />
          <span className="font-semibold text-white">{channelName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded hover:bg-[#4f545c] transition-colors">
            <Plus className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
          <button className="p-2 rounded hover:bg-[#4f545c] transition-colors">
            <Smile className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#202225]" ref={bottomRef}>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Hash className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-lg font-medium mb-2">Welcome to #{channelName}!</p>
              <p className="text-sm text-gray-400">This is the beginning of the #{channelName} channel.</p>
              <p className="text-sm text-gray-400">Be the first to say something!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map(message => (
              <div key={message.id} className="flex gap-3 group">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.profiles?.avatar_url ? (
                    <img 
                      src={message.profiles.avatar_url} 
                      alt={message.profiles.username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center">
                      <span className="text-white font-bold">
                        {message.profiles?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-medium text-gray-300 hover:text-white">
                      {message.profiles?.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                  <div className="bg-[#4f545c] rounded-lg p-3 group-hover:bg-[#5865f2] transition-colors">
                    <p className="text-gray-100 whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[#202225]">
        <form 
          onSubmit={sendMessage}
          className="flex items-center gap-2"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message #${channelName}`}
              className="w-full px-4 py-3 bg-[#40444b] border border-[#202225] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2] focus:border-transparent"
              disabled={sending}
            />
          </div>
          <Button 
            type="submit" 
            size="sm"
            disabled={!input.trim() || sending}
            className="px-4 py-2 bg-[#5865f2] hover:bg-[#4752c5] text-white font-medium transition-colors disabled:opacity-50"
          >
            {sending ? (
              <div className="w-4 h-4 animate-spin rounded border-2 border-gray-600 border-t-transparent"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

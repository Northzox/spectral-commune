import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (serverId: string) => void;
}

export default function CreateServerDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);

    const { data: server, error } = await supabase
      .from('servers')
      .insert({ name: name.trim(), owner_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Join as member
    await supabase.from('server_members').insert({ server_id: server.id, user_id: user.id });

    // Create default category and channel
    const { data: category } = await supabase
      .from('channel_categories')
      .insert({ server_id: server.id, name: 'Text Channels' })
      .select()
      .single();

    if (category) {
      await supabase.from('channels').insert({
        server_id: server.id,
        category_id: category.id,
        name: 'general',
        type: 'text',
      });
    }

    toast.success(`Server "${name}" created!`);
    setName('');
    setLoading(false);
    onCreated(server.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create a Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>Server Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Awesome Server" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Server'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

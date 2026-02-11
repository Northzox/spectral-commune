import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) {
      toast.error('Server name is required');
      return;
    }
    
    if (name.trim().length < 2) {
      toast.error('Server name must be at least 2 characters');
      return;
    }
    
    if (name.trim().length > 100) {
      toast.error('Server name must be less than 100 characters');
      return;
    }

    setLoading(true);

    try {
      const { data: server, error } = await supabase
        .from('servers')
        .insert({ 
          name: name.trim(), 
          description: description.trim(),
          owner_id: user.id 
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!server) {
        toast.error('Failed to create server');
        setLoading(false);
        return;
      }

      // Join as member
      const { error: memberError } = await supabase.from('server_members').insert({ 
        server_id: server.id, 
        user_id: user.id 
      });

      if (memberError) {
        toast.error('Server created but failed to join: ' + memberError.message);
      }

      // Create default category and channel
      const { data: category } = await supabase
        .from('channel_categories')
        .insert({ 
          server_id: server.id, 
          name: 'Text Channels',
          position: 0 
        })
        .select()
        .single();

      if (category) {
        await supabase.from('channels').insert({
          server_id: server.id,
          category_id: category.id,
          name: 'general',
          type: 'text',
          position: 0,
        });
      }

      toast.success(`Server "${name}" created successfully!`);
      setName('');
      setDescription('');
      setLoading(false);
      onCreated(server.id);
    } catch (error) {
      console.error('Server creation error:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create a Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <Input 
              id="server-name"
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="My Awesome Server" 
              required 
              minLength={2}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              2-100 characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-description">Description (Optional)</Label>
            <Textarea 
              id="server-description"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Describe your server..." 
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Server'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

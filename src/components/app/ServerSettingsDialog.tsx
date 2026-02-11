import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Settings, Trash2 } from 'lucide-react';

interface Server {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  banner_url: string | null;
  owner_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string | null;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export default function ServerSettingsDialog({ open, onOpenChange, serverId, onUpdated, onDeleted }: Props) {
  const { user } = useAuth();
  const [server, setServer] = useState<Server | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!serverId || !open) return;
    
    const fetchServer = async () => {
      const { data } = await supabase
        .from('servers')
        .select('*')
        .eq('id', serverId)
        .single();
      
      if (data) {
        setServer(data);
        setName(data.name);
        setDescription(data.description || '');
      }
    };
    
    fetchServer();
  }, [serverId, open]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !server || !name.trim()) return;
    
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
      const { error } = await supabase
        .from('servers')
        .update({ 
          name: name.trim(), 
          description: description.trim()
        })
        .eq('id', server.id)
        .eq('owner_id', user.id);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success('Server updated successfully!');
      setLoading(false);
      onUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Server update error:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !server) return;
    
    if (!confirm(`Are you sure you want to delete "${server.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(true);

    try {
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', server.id)
        .eq('owner_id', user.id);

      if (error) {
        toast.error(error.message);
        setDeleteLoading(false);
        return;
      }

      toast.success('Server deleted successfully!');
      setDeleteLoading(false);
      onDeleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Server deletion error:', error);
      toast.error('An unexpected error occurred');
      setDeleteLoading(false);
    }
  };

  const isOwner = user && server && user.id === server.owner_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Server Settings
          </DialogTitle>
        </DialogHeader>
        
        {server && (
          <>
            <form onSubmit={handleUpdate} className="space-y-4">
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
                  disabled={!isOwner}
                />
                <p className="text-xs text-muted-foreground">
                  2-100 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="server-description">Description</Label>
                <Textarea 
                  id="server-description"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Describe your server..." 
                  rows={3}
                  maxLength={500}
                  disabled={!isOwner}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 characters
                </p>
              </div>

              {isOwner && (
                <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </form>

            {isOwner && (
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteLoading ? 'Deleting...' : 'Delete Server'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This action cannot be undone
                </p>
              </div>
            )}

            {!isOwner && (
              <p className="text-sm text-muted-foreground text-center">
                Only the server owner can modify server settings
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

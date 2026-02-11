import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { FolderPlus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  onCreated: () => void;
}

export default function CreateCategoryDialog({ open, onOpenChange, serverId, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    if (name.trim().length < 2) {
      toast.error('Category name must be at least 2 characters');
      return;
    }
    
    if (name.trim().length > 50) {
      toast.error('Category name must be less than 50 characters');
      return;
    }

    setLoading(true);

    try {
      // Get the highest position for categories in this server
      const { data: maxPosition } = await supabase
        .from('channel_categories')
        .select('position')
        .eq('server_id', serverId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = maxPosition ? maxPosition.position + 1 : 0;

      const { data: category, error } = await supabase
        .from('channel_categories')
        .insert({ 
          name: name.trim(),
          server_id: serverId,
          position: newPosition
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!category) {
        toast.error('Failed to create category');
        setLoading(false);
        return;
      }

      toast.success(`Category "${name}" created successfully!`);
      setName('');
      setLoading(false);
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Category creation error:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Create Category
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input 
              id="category-name"
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Text Channels" 
              required 
              minLength={2}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              2-50 characters
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            <FolderPlus className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Category'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

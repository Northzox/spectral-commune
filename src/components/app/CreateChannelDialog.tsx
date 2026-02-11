import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Hash, Volume2, Megaphone, MessageSquare, Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  onCreated: () => void;
}

const channelTypes = [
  { value: 'text', label: 'Text Channel', icon: Hash },
  { value: 'voice', label: 'Voice Channel', icon: Volume2 },
  { value: 'announcement', label: 'Announcement Channel', icon: Megaphone },
  { value: 'forum', label: 'Forum Channel', icon: MessageSquare },
];

export default function CreateChannelDialog({ open, onOpenChange, serverId, onCreated }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [type, setType] = useState<'text' | 'voice' | 'announcement' | 'forum'>('text');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serverId || !open) return;
    
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('channel_categories')
        .select('*')
        .eq('server_id', serverId)
        .order('position');
      
      if (data) {
        setCategories(data);
        if (data.length > 0 && !categoryId) {
          setCategoryId(data[0].id);
        }
      }
    };
    
    fetchCategories();
  }, [serverId, open]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) {
      toast.error('Channel name is required');
      return;
    }
    
    if (name.trim().length < 2) {
      toast.error('Channel name must be at least 2 characters');
      return;
    }
    
    if (name.trim().length > 100) {
      toast.error('Channel name must be less than 100 characters');
      return;
    }

    setLoading(true);

    try {
      // Get the highest position for the category
      const { data: maxPosition } = await supabase
        .from('channels')
        .select('position')
        .eq('server_id', serverId)
        .eq('category_id', categoryId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const newPosition = maxPosition ? maxPosition.position + 1 : 0;

      const { data: channel, error } = await supabase
        .from('channels')
        .insert({ 
          name: name.trim().toLowerCase().replace(/\s+/g, '-'),
          topic: topic.trim(),
          type,
          server_id: serverId,
          category_id: categoryId,
          position: newPosition
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (!channel) {
        toast.error('Failed to create channel');
        setLoading(false);
        return;
      }

      toast.success(`Channel "${name}" created successfully!`);
      setName('');
      setTopic('');
      setType('text');
      setLoading(false);
      onCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Channel creation error:', error);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  const selectedType = channelTypes.find(t => t.value === type);
  const Icon = selectedType?.icon || Hash;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Icon className="w-5 h-5" />
            Create Channel
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-type">Channel Type</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {channelTypes.map(channelType => {
                  const TypeIcon = channelType.icon;
                  return (
                    <SelectItem key={channelType.value} value={channelType.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4" />
                        {channelType.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name</Label>
            <Input 
              id="channel-name"
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="general" 
              required 
              minLength={2}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              2-100 characters, will be converted to lowercase with hyphens
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-topic">Topic (Optional)</Label>
            <Textarea 
              id="channel-topic"
              value={topic} 
              onChange={e => setTopic(e.target.value)} 
              placeholder="What's this channel about?" 
              rows={2}
              maxLength={1024}
            />
            <p className="text-xs text-muted-foreground">
              {topic.length}/1024 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-category">Category</Label>
            <Select value={categoryId || ''} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Channel'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

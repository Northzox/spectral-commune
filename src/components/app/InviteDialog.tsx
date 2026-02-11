import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserPlus, Copy, Link } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
}

export default function InviteDialog({ open, onOpenChange, serverId }: Props) {
  const { user } = useAuth();
  const [invites, setInvites] = useState<any[]>([]);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const code = generateInviteCode();
      const { data, error } = await supabase
        .from('server_invites')
        .insert({
          server_id: serverId,
          code,
          created_by: user.id,
          max_uses: maxUses ? parseInt(maxUses) : null
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setNewInviteCode(code);
        toast.success('Invite created successfully!');
        fetchInvites();
        setMaxUses('');
      }
    } catch (error) {
      console.error('Invite creation error:', error);
      toast.error('Failed to create invite');
    }

    setLoading(false);
  };

  const fetchInvites = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('server_invites')
      .select('*')
      .eq('server_id', serverId)
      .order('created_at', { ascending: false });

    if (data) {
      setInvites(data);
    }
  };

  const copyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    toast.success('Invite link copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteInvite = async (inviteId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('server_invites')
      .delete()
      .eq('id', inviteId)
      .eq('server_id', serverId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Invite deleted');
      fetchInvites();
    }
  };

  useState(() => {
    if (open) {
      fetchInvites();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite People
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Create New Invite */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Create New Invite</h3>
            <form onSubmit={createInvite} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="max-uses">Max Uses (Optional)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  max="100"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <UserPlus className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Invite'}
              </Button>
            </form>
          </div>

          {/* New Invite Code Display */}
          {newInviteCode && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">New Invite Code</p>
                  <p className="text-lg font-mono text-green-600">{newInviteCode}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyInviteLink(newInviteCode)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Existing Invites */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Active Invites</h3>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active invites</p>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div key={invite.id} className="p-3 bg-surface rounded-md border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{invite.code}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInviteLink(invite.code)}
                        >
                          {copiedCode === invite.code ? 'Copied!' : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteInvite(invite.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Uses: {invite.uses}{invite.max_uses ? `/${invite.max_uses}` : ' (unlimited)'}</p>
                      <p>Created: {new Date(invite.created_at).toLocaleDateString()}</p>
                      {invite.expires_at && (
                        <p>Expires: {new Date(invite.expires_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Share invite links with people you want to join your server</p>
            <p>• Anyone with the link can join if they have uses remaining</p>
            <p>• You can delete invites at any time</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

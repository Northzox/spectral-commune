import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Shield, Bell, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function UserSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setUsername(data.username);
        setBio(data.bio || '');
        setCustomStatus(data.custom_status || '');
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      username,
      bio,
      custom_status: customStatus,
    }).eq('id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated!');
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-56 bg-card border-r border-border p-4 flex flex-col">
        <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <nav className="space-y-1">
          {[
            { icon: User, label: 'My Account' },
            { icon: Shield, label: 'Privacy' },
            { icon: Bell, label: 'Notifications' },
            { icon: Lock, label: 'Security' },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors">
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto">
          <Button variant="destructive" size="sm" className="w-full" onClick={async () => { await signOut(); navigate('/'); }}>
            Log Out
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 max-w-2xl">
        <h1 className="text-2xl font-display font-bold mb-6">My Account</h1>
        
        <div className="space-y-6">
          <div className="p-6 bg-card rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">{username.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold">{username}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Custom Status</Label>
              <Input value={customStatus} onChange={e => setCustomStatus(e.target.value)} placeholder="What are you up to?" />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself" rows={3} />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

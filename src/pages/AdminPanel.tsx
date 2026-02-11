import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { checkIsAdmin } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Ban, CheckCircle, XCircle, Shield, Users, MessageSquare, FileText, Award, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'users' | 'appeals' | 'audit' | 'badges';

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
}

interface Appeal {
  id: string;
  user_id: string;
  reason: string;
  status: string;
  created_at: string;
  profiles?: { username: string };
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  created_at: string;
}

interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge?: Badge;
  profiles?: { username: string };
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [newBadge, setNewBadge] = useState({ name: '', icon: '', description: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');

  useEffect(() => {
    if (!user) return;
    checkIsAdmin(user.id).then(setIsAdmin);
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'users') {
      supabase.from('profiles').select('id, username, email, created_at').then(({ data }) => {
        if (data) setUsers(data);
      });
    } else if (tab === 'appeals') {
      supabase.from('appeals').select('*, profiles:user_id(username)').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setAppeals(data as any);
      });
    } else if (tab === 'audit') {
      supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => {
        if (data) setAuditLogs(data);
      });
    } else if (tab === 'badges') {
      supabase.from('badges').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setBadges(data);
      });
      supabase.from('user_badges').select('*, badges(*), profiles:user_id(username)').order('awarded_at', { ascending: false }).then(({ data }) => {
        if (data) setUserBadges(data as any);
      });
    }
  }, [isAdmin, tab]);

  if (loading || isAdmin === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const handleBan = async (userId: string) => {
    await supabase.from('bans').insert({ user_id: userId, banned_by: user.id, is_global: true, reason: 'Admin action' });
    await supabase.from('audit_log').insert({ actor_id: user.id, action: 'ban_user', target_type: 'user', target_id: userId });
    toast.success('User banned');
  };

  const handleAppeal = async (appealId: string, status: 'approved' | 'denied') => {
    await supabase.from('appeals').update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', appealId);
    await supabase.from('audit_log').insert({ actor_id: user.id, action: `appeal_${status}`, target_type: 'appeal', target_id: appealId });
    setAppeals(prev => prev.map(a => a.id === appealId ? { ...a, status } : a));
    toast.success(`Appeal ${status}`);
  };

  const handleCreateBadge = async () => {
    if (!newBadge.name || !newBadge.icon || !newBadge.description) {
      toast.error('All badge fields are required');
      return;
    }
    
    const { data, error } = await supabase.from('badges').insert(newBadge).select();
    if (error) {
      toast.error('Failed to create badge');
      return;
    }
    
    setBadges(prev => [data![0], ...prev]);
    setNewBadge({ name: '', icon: '', description: '' });
    toast.success('Badge created');
    await supabase.from('audit_log').insert({ actor_id: user.id, action: 'create_badge', target_type: 'badge', target_id: data![0].id });
  };

  const handleDeleteBadge = async (badgeId: string) => {
    await supabase.from('badges').delete().eq('id', badgeId);
    setBadges(prev => prev.filter(b => b.id !== badgeId));
    toast.success('Badge deleted');
    await supabase.from('audit_log').insert({ actor_id: user.id, action: 'delete_badge', target_type: 'badge', target_id: badgeId });
  };

  const handleAwardBadge = async () => {
    if (!selectedUserId || !selectedBadgeId) {
      toast.error('Please select both user and badge');
      return;
    }
    
    const { error } = await supabase.from('user_badges').insert({ user_id: selectedUserId, badge_id: selectedBadgeId });
    if (error) {
      toast.error('Failed to award badge (user may already have this badge)');
      return;
    }
    
    setSelectedUserId('');
    setSelectedBadgeId('');
    toast.success('Badge awarded');
    await supabase.from('audit_log').insert({ actor_id: user.id, action: 'award_badge', target_type: 'user_badge', target_id: selectedUserId });
    
    // Refresh user badges
    supabase.from('user_badges').select('*, badges(*), profiles:user_id(username)').order('awarded_at', { ascending: false }).then(({ data }) => {
      if (data) setUserBadges(data as any);
    });
  };

  const handleRevokeBadge = async (userBadgeId: string) => {
    await supabase.from('user_badges').delete().eq('id', userBadgeId);
    setUserBadges(prev => prev.filter(ub => ub.id !== userBadgeId));
    toast.success('Badge revoked');
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-56 bg-card border-r border-border p-4 flex flex-col">
        <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to App
        </button>
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-sm">Admin Panel</span>
        </div>
        <nav className="space-y-1">
          {([
            { id: 'users' as Tab, icon: Users, label: 'Users' },
            { id: 'appeals' as Tab, icon: FileText, label: 'Appeals' },
            { id: 'audit' as Tab, icon: MessageSquare, label: 'Audit Log' },
            { id: 'badges' as Tab, icon: Award, label: 'Badges' },
          ]).map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                tab === item.id ? 'bg-surface-active text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {tab === 'users' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">User Management</h1>
            <div className="mb-4 relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-9" />
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Username</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Joined</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleBan(u.id)}>
                          <Ban className="w-3 h-3 mr-1" /> Ban
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'appeals' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">Appeals</h1>
            <div className="space-y-4">
              {appeals.map(a => (
                <div key={a.id} className="p-4 bg-card rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{(a as any).profiles?.username || 'Unknown'}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'pending' ? 'bg-idle/20 text-idle' :
                      a.status === 'approved' ? 'bg-online/20 text-online' :
                      'bg-destructive/20 text-destructive'
                    }`}>{a.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{a.reason}</p>
                  {a.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAppeal(a.id, 'approved')} className="bg-online hover:bg-online/80">
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAppeal(a.id, 'denied')}>
                        <XCircle className="w-3 h-3 mr-1" /> Deny
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {appeals.length === 0 && <p className="text-muted-foreground text-center py-8">No appeals to review.</p>}
            </div>
          </>
        )}

        {tab === 'audit' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">Audit Log</h1>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Action</th>
                    <th className="text-left px-4 py-3 font-medium">Target</th>
                    <th className="text-left px-4 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.target_type}: {log.target_id?.substring(0, 8)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'badges' && (
          <>
            <h1 className="text-2xl font-display font-bold mb-6">Badge Management</h1>
            
            {/* Create New Badge */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Create New Badge
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Badge Name"
                  value={newBadge.name}
                  onChange={e => setNewBadge(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Icon (emoji)"
                  value={newBadge.icon}
                  onChange={e => setNewBadge(prev => ({ ...prev, icon: e.target.value }))}
                />
                <Input
                  placeholder="Description"
                  value={newBadge.description}
                  onChange={e => setNewBadge(prev => ({ ...prev, description: e.target.value }))}
                />
                <Button onClick={handleCreateBadge} disabled={!newBadge.name || !newBadge.icon || !newBadge.description}>
                  Create Badge
                </Button>
              </div>
            </div>

            {/* Award Badge */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Award Badge to User</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                  value={selectedUserId} 
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
                <select 
                  value={selectedBadgeId} 
                  onChange={e => setSelectedBadgeId(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                >
                  <option value="">Select Badge</option>
                  {badges.map(b => (
                    <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                  ))}
                </select>
                <Button onClick={handleAwardBadge} disabled={!selectedUserId || !selectedBadgeId}>
                  Award Badge
                </Button>
              </div>
            </div>

            {/* Existing Badges */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">All Badges</h2>
                <div className="space-y-3">
                  {badges.map(badge => (
                    <div key={badge.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <h3 className="font-medium">{badge.name}</h3>
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteBadge(badge.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {badges.length === 0 && <p className="text-muted-foreground text-center py-4">No badges created yet.</p>}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">Awarded Badges</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userBadges.map(ub => (
                    <div key={ub.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{ub.badge?.icon}</span>
                        <div>
                          <h3 className="font-medium">{ub.badge?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ub.profiles?.username} • {new Date(ub.awarded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => handleRevokeBadge(ub.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {userBadges.length === 0 && <p className="text-muted-foreground text-center py-4">No badges awarded yet.</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

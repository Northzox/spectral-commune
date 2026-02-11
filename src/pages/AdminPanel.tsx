import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { checkIsAdmin } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Ban, CheckCircle, XCircle, Shield, Users, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'users' | 'appeals' | 'audit';

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

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

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
      </div>
    </div>
  );
}

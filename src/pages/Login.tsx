import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ghost } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      navigate('/app');
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Verification email resent! Check your inbox.');
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen haunted-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Ghost className="w-5 h-5 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-display font-bold">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to Spectral Commune</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-card p-6 rounded-xl border border-border">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full glow-red" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="space-y-3 mt-4">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">Sign up</Link>
          </p>
          <div className="text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="text-xs"
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

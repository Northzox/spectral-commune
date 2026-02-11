import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ghost } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    console.log('Attempting to register with:', { email, username: username });
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    
    console.log('Registration response:', { error, data });
    
    if (error) {
      console.error('Registration error:', error);
      toast.error(error.message);
    } else {
      console.log('Registration successful, check email');
      toast.success('Check your email to verify your account! If you don\'t see it, check your spam folder.');
      navigate('/login');
    }
    setLoading(false);
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
          <h1 className="text-2xl font-display font-bold">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Join Spectral Commune</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 bg-card p-6 rounded-xl border border-border">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="darknight42" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full glow-red" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

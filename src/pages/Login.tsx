import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img 
              src="https://preview.redd.it/harold-4k-png-v0-b01zxg150zt81.png?width=640&crop=smart&auto=webp&s=c1b66d012695f1b68518a74af96feaa683bd9fed"
              alt="Haunted Cord" 
              className="w-10 h-10 rounded-lg"
            />
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to Haunted Cord</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="•••••••" className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="space-y-3 mt-4">
          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-red-500 hover:text-red-400">Sign up</Link>
          </p>
          <div className="text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="text-xs border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

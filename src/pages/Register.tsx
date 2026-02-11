import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Join Haunted Cord</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 bg-gray-900 p-6 rounded-xl border border-gray-800">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required placeholder="darknight42" className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••" className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-red-500 hover:text-red-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

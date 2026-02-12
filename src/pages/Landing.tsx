import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Mic, Bot, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: MessageSquare, title: 'Real-time Chat', desc: 'Instant messaging with threads, reactions, and rich media support.' },
  { icon: Mic, title: 'Voice & Video', desc: 'Crystal clear voice channels with screen sharing and video.' },
  { icon: Bot, title: 'Bot Platform', desc: 'Build and deploy custom bots with our developer API.' },
  { icon: Shield, title: 'Moderation', desc: 'Powerful admin tools to keep your community safe.' },
  { icon: Users, title: 'Communities', desc: 'Create servers with roles, permissions, and channels.' },
  { icon: Zap, title: 'Blazing Fast', desc: 'Built on modern infrastructure for zero-lag experience.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-900 bg-black/90 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="https://preview.redd.it/harold-4k-png-v0-b01zxg150zt81.png?width=640&crop=smart&auto=webp&s=c1b66d012695f1b68518a74af96feaa683bd9fed"
              alt="Haunted Cord" 
              className="w-8 h-8 rounded-lg"
            />
            <span className="font-bold text-lg tracking-wide text-white">
              Haunted<span className="text-red-500">Cord</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-900">Log In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-red-500 block" style={{
                textShadow: '0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)',
                fontFamily: 'serif',
                letterSpacing: '0.05em'
              }}>
                Stay Anonymous
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Where shadows communicate freely. 
              No traces. No limits. Complete privacy.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-base px-8">
                  Enter Shadows — Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-950">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-white">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-gray-900 border border-gray-800 hover:border-red-900/50 transition-all group"
              >
                <f.icon className="w-8 h-8 text-red-500 mb-4 group-hover:text-red-400 transition-all" />
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 px-6 bg-black">
        <div className="container mx-auto text-center text-sm text-gray-500">
          © 2026 Haunted Cord. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

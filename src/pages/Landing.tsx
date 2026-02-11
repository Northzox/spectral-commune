import { motion } from 'framer-motion';
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
    <div className="min-h-screen haunted-bg">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary font-display font-bold text-sm">H</span>
            </div>
            <span className="font-display font-bold text-lg tracking-wide text-foreground">
              Haunted<span className="text-primary">Cord</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="glow-red">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Where Gamers
              <span className="text-primary text-glow block">Unite</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              A dark, powerful communication platform built for gaming communities. 
              No compromises. No limits. Free forever.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="glow-red text-base px-8">
                  Get Started — Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.h2 
            className="text-3xl font-display font-bold text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Built for <span className="text-primary">Power Users</span>
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <f.icon className="w-8 h-8 text-primary mb-4 group-hover:text-glow transition-all" />
                <h3 className="font-semibold text-foreground mb-2 font-display">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © 2026 Haunted Cord. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

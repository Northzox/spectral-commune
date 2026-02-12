import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Landing from '@/pages/Landing-simple';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AppLayout from '@/pages/AppLayout';
import UserSettings from '@/pages/UserSettings';
import AdminPanel from '@/pages/AdminPanel';
import Home from '@/pages/Home';
import TestLogin from '@/pages/TestLogin';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/app" element={<AppLayout />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/home" element={<Home />} />
            <Route path="/test" element={<TestLogin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

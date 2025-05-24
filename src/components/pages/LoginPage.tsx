import { useState } from 'react';
import { User, Key, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginPageProps {
  onLogin: (userId: string, role: 'admin' | 'agent') => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId || !password) {
      setError('Please enter both ID and password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }
      onLogin(data.id, data.role);
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 transform transition-all">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">CallSense</h1>
          <p className="text-white/70 mt-2">Call monitoring & emotion analytics</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-white text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <label className={cn(
              "flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all",
              role === 'agent' 
                ? "bg-white/20 border-cyan-500/50 text-white" 
                : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
            )}>
              <input 
                type="radio" 
                name="role" 
                value="agent" 
                checked={role === 'agent'} 
                onChange={() => setRole('agent')} 
                className="sr-only"
              />
              <span>Agent</span>
            </label>

            <label className={cn(
              "flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all",
              role === 'admin' 
                ? "bg-white/20 border-cyan-500/50 text-white" 
                : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
            )}>
              <input 
                type="radio" 
                name="role" 
                value="admin" 
                checked={role === 'admin'} 
                onChange={() => setRole('admin')} 
                className="sr-only"
              />
              <span>Admin</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center",
              "text-white font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
              isLoading && "opacity-70 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Login <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Phone(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
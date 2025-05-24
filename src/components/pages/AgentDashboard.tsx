import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import CallList from '@/components/agent/CallList';

interface AgentDashboardProps {
  user: { id: string; role: 'agent'; name: string };
  onLogout: () => void;
}

export default function AgentDashboard({ user, onLogout }: AgentDashboardProps) {
  const [stats, setStats] = useState<{ todayCalls: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/calls/agent-stats?agentId=${user.id}`)
      .then(res => res.json())
      .then(data => setStats({ todayCalls: data.todayCalls }));
  }, [user.id]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onLogout={onLogout}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        userName={user.name}
        role={user.role}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Agent Dashboard</h1>
            <p className="text-white/70">
              Monitor your calls in real-time
            </p>
          </header>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 flex flex-col">
              <h3 className="text-white/80 text-sm font-medium mb-2">Today's Calls</h3>
              <div className="text-4xl font-bold text-white mb-2">{stats ? stats.todayCalls : '...'}</div>
              <div className="text-green-400 text-sm flex items-center mt-auto">
                <span className="bg-green-500/20 p-1 rounded mr-1.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 1L9 5L5 9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span>Compared to yesterday</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <CallList agentId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
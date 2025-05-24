import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import AgentList from '@/components/dashboard/AgentList';

interface AdminDashboardProps {
  user: { id: string; role: 'admin'; name: string };
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onLogout={onLogout}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        userName={user.name}
        role={user.role}
        currentPage="admin-dashboard" // <-- add this line
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Agent Management</h1>
            <p className="text-white/70">
              Add, edit, or delete agents below.
            </p>
          </header>
          <AgentList createdBy={user.id} />
        </div>
      </main>
    </div>
  );
}
import { useState,useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme/theme-provider';
import LoginPage from '@/components/pages/LoginPage';
import AdminDashboard from '@/components/pages/AdminDashboard';
import AgentDashboard from '@/components/pages/AgentDashboard';
import AgentList from '@/components/dashboard/AgentList';
import CallList from '@/components/agent/CallList';
import EmotionAnalyticsCard from '@/components/dashboard/EmotionAnalyticsCard';
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; role: 'admin' | 'agent' } | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false); 
  }, []);

 const handleLogin = (userId: string, role: 'admin' | 'agent') => {
  const userData = { id: userId, role };
  localStorage.setItem('user', JSON.stringify(userData)); // ✅ persist user
  setUser(userData);
};


 const handleLogout = () => {
  localStorage.removeItem('user'); // ✅ clear on logout
  setUser(null);
};


  return (
    <ThemeProvider defaultTheme="dark" storageKey="dashboard-theme">
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-blue-900">
          {loading ? (
            <div>Loading ... </div>
          ): !user ? (
            <LoginPage onLogin={handleLogin} />
          ) : user.role === 'admin' ? (
            <Routes>
              <Route path="/" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
              <Route path="/agents" element={<AgentList />} />
              <Route path="/calls" element={<CallList />} />
              <Route path="/analytics" element={<EmotionAnalyticsCard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<AgentDashboard user={user} onLogout={handleLogout} />} />
              <Route path="/calls" element={<CallList />} />
              <Route path="/analytics" element={<EmotionAnalyticsCard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
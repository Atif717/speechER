import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Home, Users, Phone, BarChart2, Settings,
  Menu, X, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onLogout: () => void;
  userName: string;
  role: 'admin' | 'agent';
  open: boolean;
  setOpen: (open: boolean) => void;
  currentPage?: string; // <-- add this
}

export default function Sidebar({ onLogout, userName, role, open, setOpen, currentPage }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const navigate = useNavigate();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'agents', label: 'Agents', icon: Users, path: '/agents', adminOnly: true },
    { id: 'calls', label: 'Calls', icon: Phone, path: '/calls' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/analytics' },
    // { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  // Hide calls and analytics only for admin on admin dashboard
  const filteredNavItems = navItems.filter(item => {
    if (
      role === 'admin' &&
      (item.id === 'calls' || item.id === 'analytics') &&
      currentPage === 'admin-dashboard'
    ) {
      return false;
    }
    return !item.adminOnly || (item.adminOnly && role === 'admin');
  });

  const handleNavigation = (item: typeof navItems[0]) => {
    setActiveItem(item.id);
    navigate(item.path);
    setOpen(false); // close sidebar on mobile after navigation
  };

  const sidebarContent = (
    <div
      className={cn(
        "h-screen flex flex-col transition-all duration-300 bg-white/10 backdrop-blur-md shadow-xl",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className={cn("flex items-center", isCollapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <Phone className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <h1 className="ml-3 text-xl font-bold text-white tracking-tight">CallSense</h1>
          )}
        </div>
        {/* Unified toggle button for desktop and mobile */}
        <button
          onClick={() => {
            if (window.innerWidth < 768) {
              setOpen(!open); // mobile: open/close sidebar drawer
            } else {
              toggleSidebar(); // desktop: collapse/expand sidebar
            }
          }}
          className="text-white/80 hover:text-white transition-colors"
        >
          {(window.innerWidth < 768 ? open : !isCollapsed) ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {filteredNavItems.map((item) => (
            <li key={item.id}>
              <button
                className={cn(
                  "w-full flex items-center p-3 rounded-lg transition-all duration-200",
                  "hover:bg-white/20",
                  activeItem === item.id
                    ? "bg-white/20 text-white"
                    : "text-white/70 hover:text-white",
                  isCollapsed && "justify-center"
                )}
                onClick={() => handleNavigation(item)}
              >
                <item.icon className={cn("w-6 h-6", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className={cn(
          "flex items-center p-3 rounded-lg transition-all hover:bg-white/10",
          isCollapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {(userName || 'AD').slice(0, 2).toUpperCase()}
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-white/60 capitalize">{role}</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            "mt-2 w-full flex items-center p-3 rounded-lg transition-all",
            "text-white/70 hover:bg-white/10 hover:text-white",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Responsive Hamburger Toggle for Mobile */}
      {!open && (
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white/80 rounded-full p-2 shadow"
          onClick={() => setOpen(true)}
        >
          <Menu size={24} className="text-cyan-700" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:static md:translate-x-0 transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: isCollapsed ? 80 : 256 }}
      >
        {/* Mobile backdrop */}
        {open && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <div className="relative z-40 h-full">{sidebarContent}</div>
      </div>
    </>
  );
}
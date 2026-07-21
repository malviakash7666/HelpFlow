import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  Users,
  Database,
  BarChart3,
  Settings,
  Bot,
  ShieldAlert,
  LogOut,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { company, logout } = useAuth();
  const userRole = company?.userRole || 'OWNER';
  const isSupportAgent = userRole === 'SUPPORT_AGENT';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ...(!isSupportAgent ? [{ name: 'Bot & Widget', path: '/bot-settings', icon: Bot }] : []),
    { name: 'Tickets', path: '/tickets', icon: Ticket },
    { name: 'Chat', path: '/conversations', icon: MessageSquare },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Knowledge Base', path: '/knowledge-base', icon: Database },
    ...(!isSupportAgent ? [{ name: 'Admin Analytics', path: '/admin', icon: ShieldAlert }] : []),
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    ...(!isSupportAgent ? [{ name: 'Settings', path: '/settings', icon: Settings }] : []),
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen bg-brand-sidebar border-r border-brand-border text-slate-400 flex flex-col justify-between py-6 transition-all duration-300 ease-in-out z-50 w-16 hover:w-64 group shadow-xl shadow-black/40">
      {/* Top Logo Section */}
      <div className="flex flex-col gap-8 px-3.5">
        <div className="flex items-center gap-3 overflow-hidden select-none">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            AI Support Desk
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/15'
                    : 'hover:text-white hover:bg-slate-800/40'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="px-3.5 flex flex-col gap-1.5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer hover:text-red-450 hover:bg-red-950/20 hover:border-red-900/30 border border-transparent text-slate-400 overflow-hidden"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors shrink-0" />
          <span className="text-sm font-medium text-slate-400 group-hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

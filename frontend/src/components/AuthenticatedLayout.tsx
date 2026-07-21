import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Menu, Sparkles } from 'lucide-react';

export const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!company) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col md:flex-row relative">
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-brand-sidebar/95 backdrop-blur-md border-b border-brand-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
              AI Support Desk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
            {company.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Hover-aware Sidebar Container */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className="z-50 shrink-0"
      >
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>
      
      {/* Main content pane dynamically offsets when sidebar expands on desktop */}
      <div 
        className={`flex-grow pt-14 md:pt-0 ${
          isSidebarHovered ? 'md:pl-64' : 'md:pl-16'
        } transition-all duration-300 ease-in-out min-h-screen flex flex-col relative w-full min-w-0 overflow-x-hidden`}
      >
        {children}
      </div>
    </div>
  );
};

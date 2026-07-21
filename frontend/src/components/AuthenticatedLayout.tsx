import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';

export const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Redirect to login if not authenticated
  if (!company) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex relative">
      {/* Hover-aware Sidebar Container */}
      <div
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className="h-screen z-50 shrink-0"
      >
        <Sidebar />
      </div>
      
      {/* Main content pane dynamically offsets when sidebar expands */}
      <div 
        className={`flex-grow ${
          isSidebarHovered ? 'pl-64' : 'pl-16'
        } transition-all duration-300 ease-in-out min-h-screen flex flex-col relative w-full overflow-x-hidden`}
      >
        {children}
      </div>
    </div>
  );
};

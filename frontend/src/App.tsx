import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Conversations } from './pages/Conversations';
import { Tickets } from './pages/Tickets';
import { Customers } from './pages/Customers';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { BotSettings } from './pages/BotSettings';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthenticatedLayout } from './components/AuthenticatedLayout';
import { Loader2 } from 'lucide-react';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { company } = useAuth();
  if (company?.userRole === 'SUPPORT_AGENT') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Loading Console...
        </span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      {/* Protected Console Views with Left Navigation Sidebar */}
      <Route path="/" element={<AuthenticatedLayout><Home /></AuthenticatedLayout>} />
      <Route path="/bot-settings" element={<AuthenticatedLayout><ProtectedAdminRoute><BotSettings /></ProtectedAdminRoute></AuthenticatedLayout>} />
      <Route path="/tickets" element={<AuthenticatedLayout><Tickets /></AuthenticatedLayout>} />
      <Route path="/conversations" element={<AuthenticatedLayout><Conversations /></AuthenticatedLayout>} />
      <Route path="/knowledge-base" element={<AuthenticatedLayout><KnowledgeBase /></AuthenticatedLayout>} />
      <Route path="/customers" element={<AuthenticatedLayout><Customers /></AuthenticatedLayout>} />
      <Route path="/admin" element={<AuthenticatedLayout><ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute></AuthenticatedLayout>} />
      <Route path="/settings" element={<AuthenticatedLayout><ProtectedAdminRoute><Settings /></ProtectedAdminRoute></AuthenticatedLayout>} />
      <Route path="/reports" element={<AuthenticatedLayout><Reports /></AuthenticatedLayout>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

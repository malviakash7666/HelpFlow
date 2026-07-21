import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { employeeService } from '../service/employeeService';
import type { Employee } from '../service/employeeService';
import { widgetService } from '../service/widgetService';
import type { WidgetInfo } from '../service/widgetService';
import { ticketService } from '../service/ticketService';
import type { DashboardStats } from '../service/ticketService';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { 
  Building2, 
  Globe, 
  Users, 
  UserPlus, 
  Trash2, 
  LogOut, 
  Cpu, 
  MessageSquare, 
  Database, 
  CheckCircle,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Key,
  Terminal,
  ExternalLink,
  Code,
  Loader2,
  CheckSquare
} from 'lucide-react';

export const Home: React.FC = () => {
  const { company, logout } = useAuth();
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  const [widget, setWidget] = useState<WidgetInfo | null>(null);
  const [loadingWidget, setLoadingWidget] = useState(false);
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load employees if company is logged in
  const fetchEmployees = async () => {
    if (!company) return;
    setLoadingEmployees(true);
    setEmployeeError(null);
    try {
      const response = await employeeService.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
      setEmployeeError(err.response?.data?.message || 'Failed to retrieve employees.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Load widget config
  const fetchWidgetConfig = async () => {
    if (!company) return;
    setLoadingWidget(true);
    try {
      const response = await widgetService.getWidgetConfig();
      if (response.success && response.data) {
        setWidget(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load widget config:', err);
    } finally {
      setLoadingWidget(false);
    }
  };

  // Load dashboard metrics
  const fetchStats = async () => {
    if (!company) return;
    setLoadingStats(true);
    try {
      const response = await ticketService.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (company) {
      fetchEmployees();
      fetchWidgetConfig();
      fetchStats();
    }
  }, [company]);

  const handleToggleWidget = async () => {
    if (!widget) return;
    try {
      const response = await widgetService.toggleWidget();
      if (response.success && response.data) {
        setWidget(response.data);
        toast.success(response.message || 'Widget status updated.');
      }
    } catch (err: any) {
      console.error('Toggle widget failed:', err);
      toast.error('Failed to update widget status.');
    }
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate the widget key? Any websites using the old key will lose access to the chatbot.')) return;
    try {
      const response = await widgetService.regenerateWidgetKey();
      if (response.success && response.data) {
        setWidget(response.data);
        toast.success(response.message || 'Widget key regenerated.');
      }
    } catch (err: any) {
      console.error('Regenerate key failed:', err);
      toast.error('Failed to regenerate key.');
    }
  };

  const getEmbedScript = () => {
    if (!widget) return '';
    const backendPort = 5000;
    const backendUrl = `${window.location.protocol}//${window.location.hostname}:${backendPort}`;
    return `<script\n  src="${backendUrl}/widget/widget.js"\n  data-company-id="${widget.companyId}"\n  data-widget-key="${widget.widgetKey}">\n</script>`;
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getEmbedScript());
    setCopied(true);
    toast.success('Embed script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleToggle = async (employee: Employee) => {
    const nextRole = employee.role === 'ADMIN' ? 'SUPPORT_AGENT' : 'ADMIN';
    try {
      const response = await employeeService.updateRole(employee.id, nextRole);
      if (response.success) {
        setEmployees(
          employees.map((emp) =>
            emp.id === employee.id ? { ...emp, role: nextRole } : emp
          )
        );
      }
    } catch (err: any) {
      console.error('Role toggle failed:', err);
      alert(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this employee?')) return;
    try {
      const response = await employeeService.deleteEmployee(id);
      if (response.success) {
        // Since backend does soft delete (isActive = false), let's mark it in UI or filter out
        setEmployees(employees.map(emp => emp.id === id ? { ...emp, isActive: false } : emp));
      }
    } catch (err: any) {
      console.error('Delete employee failed:', err);
      alert(err.response?.data?.message || 'Failed to delete employee.');
    }
  };

  if (!company) {
    /* UNAUTHENTICATED LANDING PAGE */
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden flex flex-col justify-between">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0,transparent_60%)] -z-10" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/3 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />

        {/* Header */}
        <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-200 to-white bg-clip-text text-transparent">
                OmniSupport AI
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/15"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 pt-20 pb-24 flex-grow flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-950/40 border border-indigo-800/40 rounded-full px-4 py-1.5 text-xs text-indigo-300 font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Multi-Tenant AI Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Automate Customer Support <br />
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
              With Retrieval-Augmented AI
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
            Equip your company with private, secure chatbot instances trained instantly on your knowledge base. Seamlessly hand off conversations to support agents when human touch is required.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Register Your Company
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center"
            >
              Explore Console
            </Link>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl text-left backdrop-blur-sm">
              <div className="w-10 h-10 bg-indigo-950 border border-indigo-800/40 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-200 mb-2">Automated RAG Chatbot</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload PDFs, website links, or text documents. Our integrated AI answers users' queries instantly based on your company documentation.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl text-left backdrop-blur-sm">
              <div className="w-10 h-10 bg-blue-950 border border-blue-800/40 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-200 mb-2">Multi-Tenant CRM</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Add and manage support agents, assign roles, monitor open tickets, and keep customer logs organized in fully isolated environments.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl text-left backdrop-blur-sm">
              <div className="w-10 h-10 bg-emerald-950 border border-emerald-800/40 rounded-xl flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-lg text-slate-200 mb-2">Production-Grade Stack</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Powered by Node.js, Express, PostgreSQL, Vector Databases, and WebSockets. Designed for reliability, low-latency, and high traffic.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900/80 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-6">
            © {new Date().getFullYear()} OmniSupport AI. All rights reserved.
          </div>
        </footer>
      </div>
    );
  }
  const formatRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = new Date().getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 65 && mins >= 0) return `${Math.max(1, mins)} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-slate-900 border-slate-800 text-slate-400';
      case 'MEDIUM': return 'bg-blue-950/40 border-blue-900/50 text-blue-400';
      case 'HIGH': return 'bg-amber-950/40 border-amber-900/50 text-amber-400';
      case 'URGENT': return 'bg-red-950/40 border-red-900/50 text-red-400';
      default: return 'bg-slate-900 border-slate-850 text-slate-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-rose-950/40 border-rose-900/50 text-rose-400';
      case 'ASSIGNED': return 'bg-indigo-950/40 border-indigo-900/50 text-indigo-400';
      case 'IN_PROGRESS': return 'bg-amber-950/40 border-amber-900/50 text-amber-400';
      case 'RESOLVED': return 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400';
      case 'CLOSED': return 'bg-slate-900 border-slate-800 text-slate-500';
      default: return 'bg-slate-900 border-slate-850 text-slate-500';
    }
  };

  /* AUTHENTICATED DASHBOARD VIEW */
  return (
    <div className="flex-grow p-8 bg-[#0a0f1d] min-h-screen text-slate-100 flex flex-col gap-6">
      
      {/* Dashboard Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1">
            Review support ticket volume, real-time assignment loads, and chatbot deflection metrics.
          </p>
        </div>

        {/* User profile widget top right */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-sm font-semibold text-white leading-tight">
              {company.name} Owner
            </span>
            <span className="block text-[10px] text-slate-550 uppercase tracking-wide font-medium">
              Administrator
            </span>
          </div>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/10">
            {company.name.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats Cards Section */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-[#0c1325]/50 border border-slate-800 p-6 rounded-2xl h-32 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              <div className="h-8 bg-slate-800 rounded w-1/3 mt-2"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2 mt-2"></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total tickets */}
          <div className="bg-[#0c1325]/60 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/5 relative overflow-hidden group hover:border-slate-800/80 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Tickets</span>
            <h3 className="text-3xl font-extrabold text-white mt-1.5">{stats.totalTickets}</h3>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-2 ${
              stats.totalGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats.totalGrowth >= 0 ? '+' : ''}{stats.totalGrowth}% from last week
            </span>
          </div>

          {/* Open tickets */}
          <div className="bg-[#0c1325]/60 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/5 relative overflow-hidden group hover:border-slate-800/80 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Open Tickets</span>
            <h3 className="text-3xl font-extrabold text-white mt-1.5">{stats.openTickets}</h3>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-2 ${
              stats.openGrowth <= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats.openGrowth >= 0 ? '+' : ''}{stats.openGrowth}% from last week
            </span>
          </div>

          {/* In Progress tickets */}
          <div className="bg-[#0c1325]/60 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/5 relative overflow-hidden group hover:border-slate-800/80 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">In Progress</span>
            <h3 className="text-3xl font-extrabold text-white mt-1.5">{stats.inProgressTickets}</h3>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-2 ${
              stats.inProgressGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats.inProgressGrowth >= 0 ? '+' : ''}{stats.inProgressGrowth}% from last week
            </span>
          </div>

          {/* Resolved tickets */}
          <div className="bg-[#0c1325]/60 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-black/5 relative overflow-hidden group hover:border-slate-800/80 transition-all">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Resolved</span>
            <h3 className="text-3xl font-extrabold text-white mt-1.5">{stats.resolvedTickets}</h3>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 mt-2 ${
              stats.resolvedGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {stats.resolvedGrowth >= 0 ? '+' : ''}{stats.resolvedGrowth}% from last week
            </span>
          </div>
        </div>
      ) : null}

      {/* Recent Tickets Section */}
      <div className="bg-[#0c1325]/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <h2 className="font-bold text-slate-200 text-sm">Recent Tickets</h2>
        </div>

        {loadingStats ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span>Loading recent submissions...</span>
          </div>
        ) : stats && stats.recentTickets.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-850 rounded-xl">
            <CheckSquare className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <h4 className="text-slate-400 font-semibold text-xs">All caught up!</h4>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1">
              No recent tickets are assigned to you. Unresolved queries from the chatbot handoff will appear here.
            </p>
          </div>
        ) : stats ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Issue</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/40 text-xs text-slate-300">
                {stats.recentTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-500 text-[10px]">
                      #{t.id.substring(0, 5).toUpperCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.customer ? (
                        <div>
                          <div className="font-semibold text-slate-200">{t.customer.name}</div>
                          <div className="text-[10px] text-slate-500">{t.customer.email}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Anonymous Visitor</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate font-medium text-slate-200" title={t.subject}>
                      {t.subject}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full ${getStatusColor(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-350">
                      {t.assignedEmployee ? (
                        t.assignedEmployee.name
                      ) : (
                        <span className="text-slate-600 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatRelativeTime(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* View All Tickets Link */}
        <div className="flex justify-center border-t border-slate-850 pt-4">
          <Link
            to="/tickets"
            className="px-5 py-2.5 bg-[#0d1527] border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            View All Tickets
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Home;

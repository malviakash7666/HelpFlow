import React, { useEffect, useState } from 'react';
import { adminService } from '../service/adminService';
import type { SystemOverview } from '../service/adminService';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert,
  Building2,
  Users,
  FileText,
  Ticket,
  Activity,
  Loader2,
  Lock,
  Clock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<SystemOverview | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const overviewRes = await adminService.getOverview();
      if (overviewRes.success) {
        setData(overviewRes.data);
      }
      const compRes = await adminService.getCompanies();
      if (compRes.success) {
        setCompanies(compRes.data);
      }
    } catch (err) {
      toast.error('Failed to load super admin data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-sm font-medium">Loading Super Admin Metrics...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2.5 text-white tracking-tight">
            <ShieldAlert className="w-7 h-7 text-indigo-500" />
            Super Admin & System Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global SaaS metrics, multi-tenant company accounts, token usage, and audit trail security logs.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Companies</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{data?.totalCompanies || 0}</span>
          </div>
        </div>

        <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Active Users</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{data?.totalUsers || 0}</span>
          </div>
        </div>

        <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Indexed Documents</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{data?.totalDocuments || 0}</span>
          </div>
        </div>

        <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl text-purple-400 shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Support Tickets</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block">{data?.totalTickets || 0}</span>
          </div>
        </div>
      </div>

      {/* Multi-Tenant Companies Table */}
      <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Building2 className="w-4 h-4 text-blue-400" />
          Registered Company Tenants
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-slate-900/30">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{company.name}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{company.email}</td>
                  <td className="py-3.5 px-4 text-slate-400">{company.industry || 'N/A'}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-900 text-emerald-400">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-[#0c1325] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Lock className="w-4 h-4 text-indigo-400" />
          Security Audit Trail Logs
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase font-bold text-[10px]">
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data?.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                    No security audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                data?.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/30">
                    <td className="py-3.5 px-4 font-semibold text-blue-300 font-mono">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{log.ipAddress || 'internal'}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{log.details}</td>
                    <td className="py-3.5 px-4 text-right text-slate-500 flex items-center justify-end gap-1.5 mt-2">
                      <Clock className="w-3 h-3 text-slate-600" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

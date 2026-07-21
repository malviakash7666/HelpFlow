import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../service/authService';
import { employeeService } from '../service/employeeService';
import type { Employee } from '../service/employeeService';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import {
  Settings as SettingsIcon,
  Sliders,
  Bell,
  Cpu,
  UserCheck,
  CheckCircle2,
  Building,
  Globe,
  Loader2,
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { company, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'assignment' | 'notifications' | 'team'>('assignment');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states - General
  const [name, setName] = useState(company?.name || '');
  const [website, setWebsite] = useState(company?.website || '');
  const [industry, setIndustry] = useState(company?.industry || '');
  const [description, setDescription] = useState(company?.description || '');

  // Form states - Auto Assignment
  const [autoAssignmentEnabled, setAutoAssignmentEnabled] = useState(company?.autoAssignmentEnabled || false);
  const [assignmentMethod, setAssignmentMethod] = useState(company?.assignmentMethod || 'ROUND_ROBIN');
  const [assignTo, setAssignTo] = useState(company?.assignTo || 'ALL_ACTIVE');
  const [fallbackEmployeeId, setFallbackEmployeeId] = useState(company?.fallbackEmployeeId || '');

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await employeeService.getEmployees();
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleRoleToggle = async (emp: Employee) => {
    const newRole = emp.role === 'ADMIN' ? 'SUPPORT_AGENT' : 'ADMIN';
    try {
      const response = await employeeService.updateRole(emp.id, newRole);
      if (response.success) {
        toast.success(`Role updated for ${emp.name}.`);
        fetchEmployees();
      }
    } catch (err: any) {
      console.error('Failed to toggle role:', err);
      toast.error('Failed to update employee role.');
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const actionText = emp.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionText} ${emp.name}?`)) return;
    try {
      const response = await employeeService.toggleStatus(emp.id);
      if (response.success) {
        toast.success(`Employee ${emp.isActive ? 'deactivated' : 'activated'} successfully.`);
        fetchEmployees();
      }
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      toast.error(err.response?.data?.message || 'Failed to update employee status.');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload: any = {};
      if (activeTab === 'general') {
        payload = { name, website, industry, description };
      } else if (activeTab === 'assignment') {
        payload = {
          autoAssignmentEnabled,
          assignmentMethod,
          assignTo,
          fallbackEmployeeId: fallbackEmployeeId || null,
        };
      } else {
        toast.info('Features outside General/Assignment are mock in this version.');
        setSaving(false);
        return;
      }

      const response = await authService.updateProfile(payload);
      if (response.success) {
        await refreshProfile();
        toast.success('Settings updated successfully.');
      }
    } catch (err: any) {
      console.error('Settings update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-grow p-8 bg-[#0a0f1d] min-h-screen text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            Settings
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Configure support routing rules, notifications, and company profile.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Side: Tabs Navigation */}
        <div className="bg-[#0c1325]/50 border border-slate-800 rounded-2xl p-4 flex flex-col gap-1.5">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
              activeTab === 'general'
                ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-850/40'
            }`}
          >
            <Building className="w-4 h-4" />
            General
          </button>
          
          <button
            onClick={() => setActiveTab('assignment')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
              activeTab === 'assignment'
                ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-850/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Auto Assignment
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
              activeTab === 'notifications'
                ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-850/40'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
              activeTab === 'team'
                ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-850/40'
            }`}
          >
            <Users className="w-4 h-4" />
            Team Directory
          </button>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="lg:col-span-3 bg-[#0c1325]/50 border border-slate-800 rounded-2xl p-6">
          <form onSubmit={handleSaveChanges} className="space-y-6">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white mb-4 pb-2 border-b border-slate-850">
                  General Company Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Website URL
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
                        <Globe className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                      placeholder="e.g. Technology, Retail, Finance"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all resize-none"
                      placeholder="Give a brief summary of what your company does..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Auto Assignment Tab */}
            {activeTab === 'assignment' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <div>
                    <h3 className="text-base font-bold text-white">Auto Assignment Rules</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      Automatically route incoming unresolved tickets to active team members.
                    </p>
                  </div>

                  {/* Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoAssignmentEnabled}
                      onChange={(e) => setAutoAssignmentEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${
                  !autoAssignmentEnabled ? 'opacity-40 pointer-events-none' : 'opacity-100'
                }`}>
                  {/* Assignment Method */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Assignment Method
                    </label>
                    <select
                      value={assignmentMethod}
                      onChange={(e) => setAssignmentMethod(e.target.value)}
                      className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-pointer"
                    >
                      <option value="ROUND_ROBIN">Round Robin (Recommended)</option>
                      <option value="LEAST_BUSY">Least Busy Agent First</option>
                    </select>
                  </div>

                  {/* Assign To */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Assign To
                    </label>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-pointer"
                    >
                      <option value="ALL_ACTIVE">All Active Employees</option>
                      <option value="SUPPORT_ONLY">Support Staff Only</option>
                    </select>
                  </div>

                  {/* Fallback Employee */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      If No One Available (Fallback)
                    </label>
                    {loadingEmployees ? (
                      <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Loading team directory...</span>
                      </div>
                    ) : (
                      <select
                        value={fallbackEmployeeId}
                        onChange={(e) => setFallbackEmployeeId(e.target.value)}
                        className="bg-[#080d1a] border border-slate-800 focus:border-blue-500 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-pointer"
                      >
                        <option value="">Assign to Specific Employee (Unassigned)</option>
                        {employees.filter(e => e.isActive).map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role.replace('_', ' ')})
                          </option>
                        ))}
                      </select>
                    )}
                    <span className="text-[9.5px] text-slate-500 leading-normal">
                      Specifies which support manager or owner receives tickets during off-hours or when no agents are active.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 py-8 text-center text-slate-500">
                <Bell className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                <p className="text-xs">Notification configuration is coming soon.</p>
              </div>
            )}

            {/* Team Directory Tab */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">Team Directory</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      Manage company support employees, toggle administrative access, and invite new agents.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/10 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Employee
                  </button>
                </div>

                {loadingEmployees ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <span>Loading team roster...</span>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-850 rounded-xl">
                    <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <h4 className="text-slate-400 font-semibold text-xs">No employees found</h4>
                    <p className="text-[10px] text-slate-550 max-w-xs mx-auto mt-1">
                      Start inviting support agents or administrators to help you manage tickets and train the AI.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/30 text-xs text-slate-350">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-900/15 group transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-200">{emp.name}</div>
                              <div className="text-[10px] text-slate-500">{emp.email}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              {emp.role === 'OWNER' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-950/80 border border-indigo-900/50 text-indigo-400">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Owner
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRoleToggle(emp)}
                                  disabled={!emp.isActive}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border transition-all cursor-pointer select-none active:scale-[0.98] ${
                                    emp.role === 'ADMIN'
                                      ? 'bg-blue-950 text-blue-400 border-blue-900 hover:bg-blue-900/60'
                                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800/80'
                                  } disabled:opacity-50 disabled:pointer-events-none`}
                                  title="Click to toggle role"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  {emp.role === 'ADMIN' ? 'Admin' : 'Support Agent'}
                                </button>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${emp.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className={emp.isActive ? 'text-slate-300 font-medium' : 'text-slate-500 italic'}>
                                  {emp.isActive ? 'Active' : 'Deactivated'}
                                </span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {emp.role !== 'OWNER' && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(emp)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    emp.isActive
                                      ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                                      : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 shadow-sm shadow-emerald-900/20'
                                  }`}
                                  title={emp.isActive ? 'Deactivate employee' : 'Activate employee'}
                                >
                                  {emp.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            {(activeTab === 'general' || activeTab === 'assignment') && (
              <div className="pt-4 border-t border-slate-800/80 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};
export default Settings;

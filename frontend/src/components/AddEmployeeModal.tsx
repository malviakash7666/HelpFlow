import React, { useState } from 'react';
import { X, Copy, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { employeeService } from '../service/employeeService';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role] = useState<'SUPPORT_AGENT'>('SUPPORT_AGENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTempPassword(null);

    if (!name || !email) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await employeeService.addEmployee({ name, email, role });
      if (response.success && response.data) {
        setTempPassword(response.data.temporaryPassword || null);
        onSuccess();
      } else {
        setError(response.message || 'Failed to add employee.');
      }
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setError(
        err.response?.data?.message ||
        'An error occurred while adding the employee.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    // Reset form states
    setName('');
    setEmail('');
    ;
    setError(null);
    setTempPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Add New Employee
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 bg-red-950/40 border border-red-800/60 rounded-xl p-4 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tempPassword ? (
            /* Success State showing temporary password */
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 text-emerald-200 text-sm">
                Employee added successfully! Provide the details below to the team member.
              </div>

              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-3">
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Name
                  </span>
                  <span className="text-sm font-medium text-slate-200">{name}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Email
                  </span>
                  <span className="text-sm font-medium text-slate-200">{email}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Temporary Password
                  </span>
                  <div className="flex items-center justify-between gap-3 mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 pl-3">
                    <span className="font-mono text-sm text-indigo-400 font-bold select-all">
                      {tempPassword}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-slate-800 rounded-md transition-colors text-slate-400 hover:text-slate-200 flex items-center gap-1.5 text-xs font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-sm mt-4"
              >
                Close Modal
              </button>
            </div>
          ) : (
            /* Input Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl text-slate-200 placeholder-slate-600 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none rounded-xl text-slate-200 placeholder-slate-600 transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Role
                </label>
                <input
                  type="text"
                  value="Support Agent"
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl text-sm cursor-not-allowed font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Employees are registered with the Support Agent role. Only the company owner holds admin rights.
                </span>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Employee'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

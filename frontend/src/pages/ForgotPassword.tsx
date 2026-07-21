import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { authService } from '../service/authService';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, Sparkles, Key, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        toast.success(response.message || 'Verification code sent to your email address.');
        setStep(2);
        setToken('');
      } else {
        setError(response.message || 'Failed to process password reset.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.resetPassword({ email, token, newPassword });
      if (response.success) {
        toast.success(response.message || 'Password reset successful!');
        navigate('/login');
      } else {
        setError(response.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 flex flex-col lg:flex-row relative overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>

      {/* Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-10 lg:px-20 py-8 sm:py-12 relative z-10">
        <div className="max-w-md w-full mx-auto">
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-wide text-white block leading-none">
                  AI Support Desk
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">
                  Account Recovery
                </span>
              </div>
            </div>

            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>

          {/* Header text */}
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {step === 1 ? 'Forgot Password?' : 'Reset Password'}
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              {step === 1
                ? 'Enter your registered email address below. We will generate a verification reset token for your account.'
                : 'Enter your 6-digit reset token and choose a new password for your account.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-950/30 border border-red-900/40 rounded-xl p-4 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-450 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 2 && (
            <div className="mb-6 bg-indigo-950/30 border border-indigo-900/50 rounded-xl p-4 text-indigo-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Verification Code Sent!</span>
              </div>
              <p className="text-slate-300 text-xs pt-1">
                We sent a 6-digit verification code to <strong className="text-white">{email}</strong>. Please check your inbox and enter the code below to set a new password.
              </p>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: Email Request */
            <form onSubmit={handleRequestToken} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Registered Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#0c1226] border border-slate-800 focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-all text-xs rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Token & New Password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Reset Token / Code
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-10 pr-4 py-3 bg-[#0c1226] border border-slate-800 focus:border-blue-500 text-slate-200 placeholder-slate-600 font-mono transition-all text-xs rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-12 py-3 bg-[#0c1226] border border-slate-800 focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-all text-xs rounded-xl outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-3 bg-[#0c1226] border border-slate-800 focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-all text-xs rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl transition-all text-center cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-slate-450 leading-relaxed">
            Remembered your password?{' '}
            <Link to="/login" className="text-blue-550 hover:underline font-semibold transition-all">
              Sign In
            </Link>
          </p>

          <footer className="mt-16 text-slate-600 text-[10px] text-center">
            © {new Date().getFullYear()} AI Support Desk. All rights reserved.
          </footer>
        </div>
      </div>

      {/* Right side illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0c1325]/45 border-l border-slate-800/80 items-center justify-center relative p-12">
        <div className="max-w-md text-center space-y-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-indigo-950/60 border border-indigo-800/40 rounded-3xl flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
            <Key className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Secure Credentials Reset
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mt-2 max-w-sm">
              Keep your team and multi-tenant customer data protected with instant encrypted password updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ForgotPassword;

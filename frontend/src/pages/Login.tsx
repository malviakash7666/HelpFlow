import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../service/authService';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success && response.data) {
        toast.success(response.message || 'Login successful.');
        login(response.data.accessToken, response.data.company);
        navigate('/');
      } else {
        const errorMsg = response.message || 'Login failed. Please check your credentials.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = 
        err.response?.data?.message || 
        'An error occurred during login. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 flex flex-col lg:flex-row relative overflow-hidden select-none">
      {/* Decorative background lights */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>
      
      {/* Left side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-10 lg:px-20 py-8 sm:py-12 relative z-10">
        <div className="max-w-md w-full mx-auto">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wide text-white block leading-none">
                AI Support Desk
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">
                Employer Login
              </span>
            </div>
          </div>

          {/* Intro Headers */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Sign In
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Welcome back! Access your company analytics, custom AI bots, and manage support agent workflows.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-950/30 border border-red-900/40 rounded-xl p-4 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-450 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-[#0c1226] border border-slate-800 focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-all text-xs rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-[#0c1226] border border-slate-800 focus:border-blue-500 text-slate-200 placeholder-slate-600 transition-all text-xs rounded-xl outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 pb-2">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-blue-550 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-450 leading-relaxed">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-550 hover:underline font-semibold transition-all">
              Register your Company
            </Link>
          </p>

          <footer className="mt-16 text-slate-600 text-[10px] text-center">
            © {new Date().getFullYear()} AI Support Desk. All rights reserved.
          </footer>
        </div>
      </div>

      {/* Right side: Illustration & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0c1325]/45 border-l border-slate-800/80 items-center justify-center relative p-12">
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-lg text-center space-y-8 flex flex-col items-center">
          {/* Detailed SVG workspace illustration */}
          <svg
            className="w-80 h-80 drop-shadow-2xl"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Table */}
            <rect x="50" y="270" width="300" height="10" rx="5" fill="#1e293b" />
            <path d="M90 280 L80 340 M310 280 L320 340" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
            
            {/* Laptop */}
            <rect x="140" y="225" width="120" height="80" rx="4" fill="#334155" />
            <rect x="148" y="233" width="104" height="64" rx="2" fill="#0f172a" />
            {/* Laptop screen mock code lines */}
            <rect x="156" y="243" width="40" height="4" rx="2" fill="#3b82f6" />
            <rect x="156" y="251" width="60" height="3" rx="1.5" fill="#64748b" />
            <rect x="156" y="258" width="50" height="3" rx="1.5" fill="#64748b" />
            <rect x="156" y="265" width="20" height="3" rx="1.5" fill="#10b981" />
            <path d="M130 305 L270 305 L260 310 L140 310 Z" fill="#64748b" />
            
            {/* Employee Character */}
            <circle cx="200" cy="120" r="30" fill="#f87171" /> {/* Head */}
            <path d="M190 90 Q200 85 210 90 L215 105 L185 105 Z" fill="#1e293b" /> {/* Hair */}
            <path d="M150 200 C150 160 170 150 200 150 C230 150 250 160 250 200 L250 270 L150 270 Z" fill="#2563eb" /> {/* Body */}
            
            {/* Chat bubble 1 */}
            <g transform="translate(40, 60)">
              <rect x="0" y="0" width="100" height="50" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
              <circle cx="20" cy="25" r="3" fill="#64748b" />
              <circle cx="30" cy="25" r="3" fill="#64748b" />
              <circle cx="40" cy="25" r="3" fill="#64748b" />
              <path d="M20 50 L10 60 L15 50 Z" fill="#1e293b" stroke="#334155" />
            </g>

            {/* Chat bubble 2 */}
            <g transform="translate(260, 100)">
              <rect x="0" y="0" width="100" height="50" rx="12" fill="#2563eb" />
              <rect x="15" y="16" width="70" height="4" rx="2" fill="#ffffff" />
              <rect x="15" y="26" width="50" height="4" rx="2" fill="#93c5fd" />
              <path d="M20 50 L10 60 L15 50 Z" fill="#2563eb" />
            </g>

            {/* Floating sparkle icons */}
            <path d="M80 180 L84 184 L80 188 L76 184 Z" fill="#60a5fa" />
            <path d="M320 230 L324 234 L320 238 L316 234 Z" fill="#34d399" />
          </svg>

          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Automated RAG-Driven Handoffs
            </h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed mt-2">
              Train your bot on documents instantly and watch it intelligently resolve queries or orchestrate manual support routing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

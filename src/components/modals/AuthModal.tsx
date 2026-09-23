import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  Building,
  ShieldCheck,
  LogIn,
  UserPlus,
  LogOut,
  CheckCircle,
  Eye,
  EyeOff,
  Sparkles,
  Database,
  KeyRound,
  Shield,
  Zap,
} from 'lucide-react';
import { authService, UserProfile } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserProfile['role']>('meteorologist');
  const [organization, setOrganization] = useState('ISRO MOSDAC / IMD RSMC Unit');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await authService.login(email, password);
      onUserChanged(data.user);
      setSuccessMsg('Live session authenticated and profile loaded!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await authService.signup({ name, email, password, role, organization });
      onUserChanged(data.user);
      setSuccessMsg('Account registered and live session activated!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoRole: UserProfile['role'], demoName: string, demoOrg: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      try {
        const data = await authService.login(demoEmail, 'password123');
        onUserChanged(data.user);
        setSuccessMsg(`Welcome back, ${data.user.name}!`);
      } catch {
        // If demo user doesn't exist yet, auto-register them!
        const data = await authService.signup({
          name: demoName,
          email: demoEmail,
          password: 'password123',
          role: demoRole,
          organization: demoOrg,
        });
        onUserChanged(data.user);
        setSuccessMsg(`Live demo account activated for ${demoName}!`);
      }
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      onUserChanged(null);
      setSuccessMsg('Signed out of session successfully.');
      setTimeout(() => setSuccessMsg(null), 1200);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-[1200] isolate flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Decorative Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Logged In User Profile Card */
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-600/20 text-cyan-400 border border-blue-500/30 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white">Live Session Active</h3>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold uppercase">
                    <Database className="w-3 h-3 text-emerald-400" /> Database Synced
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Authenticated Meteorological User</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-400" /> Full Name</span>
                <span className="font-bold text-white text-sm">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address</span>
                <span className="font-mono text-cyan-300">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-purple-400" /> Assigned Role</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-950 text-blue-300 border border-blue-800 uppercase tracking-wide">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-amber-400" /> Organization</span>
                <span className="text-slate-200 font-medium">{currentUser.organization || 'General Meteorological Office'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Saved Cyclones</span>
                <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800">
                  {currentUser.savedCyclones?.length || 0} Tracks Bookmarked
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoading ? 'Signing Out...' : 'Sign Out of Session'}</span>
            </button>
          </div>
        ) : (
          /* Live Login / Signup Portal */
          <div className="space-y-5">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  CYCLONE SIGHT AI Analyst Portal
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-bold flex items-center gap-1">
                  <Database className="w-3 h-3 text-cyan-400" /> Live DB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sign in or register your account to store cyclone bookmarks, custom alert thresholds, and personalized forecasts.
              </p>
            </div>

            {/* Quick Demo Login Option */}
            <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/60 space-y-2">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Quick 1-Click Demo Login:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickDemoLogin(
                      'analyst@cyclonesight.ai',
                      'meteorologist',
                      'Dr. Vikram Sarabhai Analyst',
                      'ISRO MOSDAC & IMD Specialist Unit'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Demo Analyst</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickDemoLogin(
                      'disaster.control@cyclonesight.ai',
                      'disaster_manager',
                      'Commander R. Verma',
                      'National Disaster Management Command'
                    )
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Disaster Officer</span>
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-2.5 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'login' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`py-2.5 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'signup' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Error / Success Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs leading-relaxed animate-in fade-in">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 font-semibold animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              /* Sign In Form */
              <form onSubmit={handleLogin} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst@cyclonesight.ai"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isLoading ? 'Authenticating Live Session...' : 'Sign In to Portal'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Create Account Form */
              <form onSubmit={handleSignup} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. A. Sharma"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.gov"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Password (min. 6 characters)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3 py-3 text-white text-xs"
                    >
                      <option value="meteorologist">Meteorologist</option>
                      <option value="researcher">Researcher</option>
                      <option value="disaster_manager">Disaster Manager</option>
                      <option value="coastal_official">Coastal Official</option>
                      <option value="public">General Public</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Organization</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="ISRO / MOSDAC / NDMA"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-3 py-3 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/25 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Registering Live Account...' : 'Register & Activate Live Session'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Lock, Mail, User, Building, ShieldCheck, LogIn, UserPlus, LogOut, CheckCircle } from 'lucide-react';
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
  const [role, setRole] = useState<UserProfile['role']>('meteorologist');
  const [organization, setOrganization] = useState('MOSDAC / SAC Remote Sensing');
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
      setSuccessMsg('Authentication successful! Profile loaded.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed.');
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
      setSuccessMsg('Account registered and stored in database successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      onUserChanged(null);
      setSuccessMsg('Logged out successfully.');
      setTimeout(() => setSuccessMsg(null), 1500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-[1200] isolate flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* User Profile View */
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Meteorological Account</h3>
                <p className="text-xs text-slate-400">Authenticated &amp; Synced with Database</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-white">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Email Address</span>
                <span className="font-mono text-cyan-300">{currentUser.email}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Role</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Organization</span>
                <span className="text-slate-200">{currentUser.organization || 'General Meteorological Office'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Database Bookmarks</span>
                <span className="font-semibold text-emerald-400">{currentUser.savedCyclones?.length || 0} Cyclones Saved</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out from Platform</span>
            </button>
          </div>
        ) : (
          /* Login / Signup Forms */
          <div className="space-y-5">
            {/* Header */}
            <div>
              <h3 className="text-lg font-bold text-white">CYCLONE SIGHT AI Analyst Portal</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign in or register to store favorite cyclone trajectories, custom alert thresholds, and operational preferences in database.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`py-2 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst@domain.gov"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                  </button>
                </div>

              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. A. Sharma"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.gov"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Password (min. 12 characters)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={12}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create secure password"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2.5 text-white text-xs"
                    >
                      <option value="meteorologist">Meteorologist</option>
                      <option value="researcher">Researcher</option>
                      <option value="disaster_manager">Disaster Manager</option>
                      <option value="coastal_official">Coastal Official</option>
                      <option value="public">General Public</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Organization</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="MOSDAC / NDMA"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2.5 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Storing in Database...' : 'Register & Store in Database'}</span>
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

import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Building,
  Database,
  Bookmark,
  CheckCircle,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Server,
} from 'lucide-react';
import { authService, UserProfile } from '../../services/authService';
import { CycloneData } from '../../types';

interface AuthViewProps {
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
  cyclones: CycloneData[];
  onSelectCyclone: (id: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  currentUser,
  onUserChanged,
  cyclones,
  onSelectCyclone,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('gauravsingh041454@gmail.com');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('meteorologist');
  const [organization, setOrganization] = useState('MOSDAC / SAC Remote Sensing');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await authService.login(email, password);
      onUserChanged(data.user);
      setSuccessMsg('Authentication successful! Profile and bookmarks loaded.');
      setTimeout(() => setSuccessMsg(null), 2500);
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
      setSuccessMsg('Account created and stored permanently in database!');
      setTimeout(() => setSuccessMsg(null), 2500);
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
      setSuccessMsg('Signed out successfully.');
      setTimeout(() => setSuccessMsg(null), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (cycloneName: string) => {
    try {
      const updated = await authService.toggleSavedCyclone(cycloneName);
      if (currentUser) {
        onUserChanged({ ...currentUser, savedCyclones: updated });
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Database Authentication &amp; User Storage</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Analyst Accounts &amp; Data Vault</h1>
          <p className="text-slate-400 text-sm mt-1">
            Secure persistent user accounts stored on server database. Keep your monitored storms, alert triggers, and preferences synchronized.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Database: <b>Online (data/users_db.json)</b></span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form or Account Details */}
        <div className="lg:col-span-7">
          {currentUser ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{currentUser.name}</h2>
                    <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                  {currentUser.role}
                </span>
              </div>

              {/* Account Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3">
                  <div className="text-slate-400 mb-1">Organization</div>
                  <div className="font-semibold text-white truncate">{currentUser.organization || 'Atmospheric Research'}</div>
                </div>
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3">
                  <div className="text-slate-400 mb-1">Database User ID</div>
                  <div className="font-mono text-cyan-300 text-[11px] truncate">{currentUser.id}</div>
                </div>
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3">
                  <div className="text-slate-400 mb-1">Registered On</div>
                  <div className="font-semibold text-slate-300">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3">
                  <div className="text-slate-400 mb-1">Active Subscriptions</div>
                  <div className="font-semibold text-emerald-400">
                    {currentUser.alertSubscribedBasins?.join(', ') || 'Bay of Bengal'}
                  </div>
                </div>
              </div>

              {/* Saved Cyclones in Database */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-amber-400" />
                    <span>Saved Cyclones in Database ({currentUser.savedCyclones?.length || 0})</span>
                  </h3>
                </div>

                {currentUser.savedCyclones && currentUser.savedCyclones.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {currentUser.savedCyclones.map((name) => {
                      const matched = cyclones.find((c) => c.name.toUpperCase().includes(name));
                      return (
                        <div
                          key={name}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-white text-xs">Cyclone {name}</div>
                            <div className="text-[10px] text-slate-400">
                              {matched ? `${matched.maxWindKmh} km/h` : 'MOSDAC Archive'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveBookmark(name)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No cyclones saved yet. Click the bookmark icon next to any cyclone to pin it to your database account.
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out of Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className={`py-2.5 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
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
                  className={`py-2.5 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'signup' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up (Store in Database)</span>
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Registered Email Address</label>
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
                  </button>

                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Dr. Gaurav Singh"
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
                        placeholder="analyst@domain.gov"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Password (min. 12 chars)</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={12}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-medium block mb-1">Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs"
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
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. ISRO SAC / IMD"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Creating Record in Database...' : 'Sign Up & Save in Database'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Database Information & Features */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Database Features &amp; Viability</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-white mb-0.5">PBKDF2 SHA-512 Hash &amp; Salt</div>
                <p className="text-slate-400 text-[11px]">
                  Passwords are salted and protected with a high-work-factor cryptographic hash.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-white mb-0.5">Real-time MOSDAC Synchronization</div>
                <p className="text-slate-400 text-[11px]">
                  Saved storm records synchronize directly with official ISRO MOSDAC SCORPIO archives.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="font-semibold text-white mb-0.5">Session Token Expiry</div>
                <p className="text-slate-400 text-[11px]">
                  A 30-day HttpOnly session cookie with instant server-side revocation on logout.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900 border border-blue-900/40 p-5 shadow-xl text-xs space-y-2">
            <div className="font-bold text-blue-300">ISRO MOSDAC SCORPIO Source</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Records are pulled from <a href="https://mosdac.gov.in/scorpio/" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">https://mosdac.gov.in/scorpio/</a> including exact coordinate fixes, 3-hour flags, and INSAT-3DS multi-channel imagery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Search, Bell, HelpCircle, Menu, UserCheck, LogIn } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { UserProfile } from '../services/authService';
import { useI18n } from '../i18n';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadAlertCount: number;
  onOpenAlerts: () => void;
  onOpenHelp: () => void;
  onToggleMobileSidebar: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  unreadAlertCount,
  onOpenAlerts,
  onOpenHelp,
  onToggleMobileSidebar,
  currentUser,
  onOpenAuth,
}) => {
  const { t } = useI18n();
  return (
    <header 
      id="main-app-header"
      className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800/80 bg-[#0a0f1d]/90 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors"
    >
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {/* CYCLONE SIGHT AI Spiral Vortex Logo */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 border border-cyan-500/30 shadow-inner group">
            <svg 
              className="w-6 h-6 animate-[spin_12s_linear_infinite]" 
              viewBox="0 0 100 100" 
              fill="none"
            >
              <defs>
                <linearGradient id="logo-swirl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" stroke="#38bdf8" strokeOpacity="0.2" strokeWidth="2" strokeDasharray="4 4" />
              <path 
                d="M 50 15 C 70 15, 88 32, 85 55 C 82 72, 65 85, 48 85 C 32 85, 20 72, 22 55 C 24 42, 35 32, 48 35 C 58 37, 62 48, 55 55 C 50 60, 42 56, 44 49" 
                stroke="url(#logo-swirl-grad)" 
                strokeWidth="5" 
                strokeLinecap="round" 
              />
              <circle cx="50" cy="50" r="4" fill="#38bdf8" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
                CYCLONE <span className="text-cyan-400">SIGHT AI</span>
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide hidden xs:block -mt-0.5">
              Cyclone Intelligence Platform
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="cyclone-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search')}
            className="w-full rounded-xl bg-slate-900/90 border border-slate-800 py-1.5 pl-9 pr-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-white"
            >
              {t('clear')}
            </button>
          )}
        </div>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Notifications Icon with Badge */}
        <button
          id="alerts-bell-button"
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer border border-transparent hover:border-slate-700"
          aria-label="Alerts and Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadAlertCount > 0 && (
            <span 
              id="alerts-count-badge"
              className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm"
            >
              {unreadAlertCount}
            </span>
          )}
        </button>

        {/* Help Circle */}
        <button
          id="help-button"
          onClick={onOpenHelp}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer border border-transparent hover:border-slate-700 hidden sm:block"
          aria-label="Platform Help"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* User Profile / Database Auth Pill */}
        <button 
          id="user-profile-widget"
          onClick={onOpenAuth}
          className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-800/80 hover:opacity-90 transition cursor-pointer text-left"
          title={currentUser ? `Logged in as ${currentUser.name}` : 'Sign In / Register Account'}
        >
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-blue-600 p-[1.5px] shadow-sm">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              {currentUser ? (
                <span className="text-xs font-bold text-cyan-300">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <LogIn className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${currentUser ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </div>

          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
              {currentUser ? currentUser.name : 'Sign In / Register'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium capitalize">
              {currentUser ? currentUser.role.replace('_', ' ') : 'Database Vault'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};

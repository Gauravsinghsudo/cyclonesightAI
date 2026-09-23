import React from 'react';
import {
  LayoutDashboard,
  Radio,
  Compass,
  Zap,
  LineChart,
  AlertTriangle,
  Bell,
  History,
  BarChart3,
  Bot,
  Settings,
  MessageSquare,
  ExternalLink,
  X,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { DataSourceItem } from '../types';

export type NavItemId = 
  | 'dashboard'
  | 'live-monitoring'
  | 'cyclone-tracker'
  | 'rapid-intensification'
  | 'forecast-models'
  | 'impact-risk-map'
  | 'alerts-notifications'
  | 'imd-bulletins'
  | 'historical-cyclones'
  | 'analytics-reports'
  | 'ai-copilot'
  | 'auth'
  | 'settings'
  | 'feedback';

interface SidebarProps {
  activeTab: NavItemId;
  onSelectTab: (id: NavItemId) => void;
  onOpenDataSources: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  dataSources?: DataSourceItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenDataSources,
  mobileOpen,
  onCloseMobile,
  dataSources,
}) => {
  const { t } = useI18n();
  const navItems = [
    { id: 'dashboard' as NavItemId, label: t('dashboard'), icon: LayoutDashboard },
    { id: 'live-monitoring' as NavItemId, label: t('liveMonitoring'), icon: Radio },
    { id: 'cyclone-tracker' as NavItemId, label: t('cycloneTracker'), icon: Compass },
    { id: 'rapid-intensification' as NavItemId, label: t('rapidIntensification'), icon: Zap },
    { id: 'forecast-models' as NavItemId, label: t('forecastModels'), icon: LineChart },
    { id: 'impact-risk-map' as NavItemId, label: t('impactRiskMap'), icon: AlertTriangle },
    { id: 'alerts-notifications' as NavItemId, label: t('alertsNotifications'), icon: Bell },
    { id: 'imd-bulletins' as NavItemId, label: 'IMD Official Bulletins', icon: FileText, isNew: true },
    { id: 'historical-cyclones' as NavItemId, label: t('historicalCyclones'), icon: History },
    { id: 'analytics-reports' as NavItemId, label: t('analyticsReports'), icon: BarChart3 },
    { id: 'ai-copilot' as NavItemId, label: t('aiCopilot'), icon: Bot, isNew: true },
    { id: 'auth' as NavItemId, label: t('accountDatabase'), icon: UserCheck },
    { id: 'settings' as NavItemId, label: t('settings'), icon: Settings },
    { id: 'feedback' as NavItemId, label: t('feedback'), icon: MessageSquare },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4 bg-[#0a0f1d] border-r border-slate-800/80 select-none">
      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="flex items-center justify-between pb-3 px-2 lg:hidden">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('navigation')}</span>
          <button 
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.isNew && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-purple-600 text-white">
                    {t('new')}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom System Status Widget */}
      <div 
        id="sidebar-system-status-card"
        className="mt-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-4 shadow-lg"
      >
        <div className="text-xs font-semibold text-white mb-2">{t('systemStatus')}</div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] text-emerald-400 font-medium">{t('allSystemsOperational')}</span>
        </div>

        <div className="flex flex-col gap-1 mb-3 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-400">{t('dataSourcesOnline')}</span>
          <span className="text-sm font-bold text-white tracking-wide">
            {dataSources ? dataSources.filter((d) => d.status === 'online').length : 9} / {dataSources ? dataSources.length : 9}
          </span>
        </div>

        <button
          id="btn-view-data-sources"
          onClick={onOpenDataSources}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[11px] font-medium text-slate-200 hover:text-white border border-slate-700/60 transition cursor-pointer"
        >
          <span>{t('viewDataSources')}</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobile} 
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

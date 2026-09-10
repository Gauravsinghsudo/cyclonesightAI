import React from 'react';
import { X, Bell, AlertTriangle, AlertCircle, CheckCircle2, Trash2, Clock, RotateCcw } from 'lucide-react';
import { AlertNotification } from '../../types';
import { getAlertRemainingTime } from '../../data/cycloneData';

interface AlertsModalProps {
  alerts: AlertNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onRestoreAlerts?: () => void;
  onSelectCyclone: (id: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  alerts,
  isOpen,
  onClose,
  onMarkAllRead,
  onClearAll,
  onRestoreAlerts,
  onSelectCyclone,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="alerts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cyclone Alerts</h3>
              <p className="text-xs text-slate-400">
                {alerts.length} {alerts.length === 1 ? 'advisory' : 'advisories'} • Auto-expires in 7 hours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-slate-400">No alerts to review (alerts auto-delete after 7 hours).</p>
              {onRestoreAlerts && (
                <button
                  onClick={onRestoreAlerts}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Default Advisories
                </button>
              )}
            </div>
          ) : alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.severity === 'urgent'
                  ? 'bg-rose-950/20 border-rose-600/40 text-rose-100'
                  : 'bg-amber-950/20 border-amber-600/40 text-amber-100'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {alert.severity === 'urgent' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-white tracking-tight">{alert.title}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 whitespace-nowrap block">{alert.timestamp}</span>
                  <span className="text-[10px] text-cyan-400 font-mono inline-flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {getAlertRemainingTime(alert.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-6">{alert.description}</p>

              {alert.cycloneId && (
                <div className="mt-3 pl-6 flex justify-end">
                  <button
                    onClick={() => {
                      onSelectCyclone(alert.cycloneId!);
                      onClose();
                    }}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    View {alert.cycloneId} in Tracker →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={onMarkAllRead}
            disabled={alerts.length === 0}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark all acknowledged</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              disabled={alerts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-800/70 text-xs font-semibold text-rose-300 hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

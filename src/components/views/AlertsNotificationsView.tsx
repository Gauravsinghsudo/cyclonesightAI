import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, ShieldCheck, Radio, Check, Info, ExternalLink, Trash2, Clock, RotateCcw } from 'lucide-react';
import { AlertNotification } from '../../types';
import { getAlertRemainingTime } from '../../data/cycloneData';

interface AlertsNotificationsViewProps {
  alerts: AlertNotification[];
  onDismissAlert?: (id: string) => void;
  onClearAlerts?: () => void;
  onRestoreAlerts?: () => void;
}

export const AlertsNotificationsView: React.FC<AlertsNotificationsViewProps> = ({
  alerts,
  onDismissAlert,
  onClearAlerts,
  onRestoreAlerts,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'urgent' | 'warning'>('all');
  const [bulletin, setBulletin] = useState<{ alert: string; source: string; timestamp: string } | null>(null);
  const [bulletinError, setBulletinError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadBulletin = async () => {
      try {
        const response = await fetch('/api/mosdac/alert', { cache: 'no-store' });
        if (!response.ok) throw new Error('Official feed unavailable');
        const data = await response.json();
        // Older running dev servers do not include isLive. Treat only an
        // explicit false as cached, while production uses the new flag.
        if (data.isLive === false) throw new Error('Official feed returned cached data');
        if (!cancelled) {
          setBulletin({ alert: data.alert, source: data.source, timestamp: data.timestamp });
          setBulletinError('');
        }
      } catch {
        if (!cancelled) setBulletinError('The official MOSDAC bulletin feed is temporarily unavailable. No stored bulletin is shown as current.');
      }
    };
    loadBulletin();
    const timer = window.setInterval(loadBulletin, 5 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'urgent') return a.severity === 'urgent';
    if (filterSeverity === 'warning') return a.severity === 'warning';
    return true;
  });

  return (
    <div id="alerts-notifications-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Official Warning &amp; Meteorological Bulletin Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated MOSDAC SCORPIO alerts, IMD 4-stage cyclone warning system &amp; evacuation directives • Auto-purged after 7 hours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alerts.length === 0 && onRestoreAlerts && (
            <button
              onClick={onRestoreAlerts}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore alerts
            </button>
          )}
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
              filterSeverity === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilterSeverity('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
              filterSeverity === 'urgent' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Red Warnings
          </button>
          {onClearAlerts && (
            <button
              onClick={onClearAlerts}
              disabled={alerts.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-rose-800/70 text-rose-300 hover:bg-rose-950/50 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear alerts
            </button>
          )}
        </div>
      </div>

      {/* Official Bulletins */}
      <div className="space-y-4">
        {bulletin && (
          <div
            className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h2 className="font-bold text-white text-sm sm:text-base">Latest MOSDAC SCORPIO Cyclone Bulletin</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 self-start sm:self-auto">
                LIVE SOURCE
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{bulletin.alert}</p>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <a className="font-medium text-cyan-300 hover:underline" href={bulletin.source} target="_blank" rel="noreferrer">Official source</a>
              <span className="font-mono text-cyan-300">Retrieved {new Date(bulletin.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
        {!bulletin && <div className="rounded-2xl border border-amber-800 bg-amber-950/20 p-5 text-xs text-amber-200">{bulletinError || 'Loading the latest official bulletin…'}</div>}
      </div>

      {/* Live Active Incident Alerts */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Live Real-Time Telemetry Alerts ({filteredAlerts.length})
        </h2>

        <div className="space-y-3">
          {filteredAlerts.length === 0 && (
            <div className="py-8 text-center space-y-3">
              <p className="text-xs text-slate-400">No active alerts (alerts are automatically deleted after 7 hours).</p>
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
          )}
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                alert.severity === 'urgent'
                  ? 'bg-rose-950/30 border-rose-900/60 text-rose-200'
                  : 'bg-slate-950/70 border-slate-800 text-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === 'urgent' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                    }`}
                  />
                  <h3 className="font-bold text-white text-xs sm:text-sm">{alert.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">({alert.timestamp})</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/50">
                    <Clock className="w-2.5 h-2.5 text-cyan-400" />
                    {getAlertRemainingTime(alert.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{alert.description}</p>
              </div>

              {onDismissAlert && (
                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition cursor-pointer"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

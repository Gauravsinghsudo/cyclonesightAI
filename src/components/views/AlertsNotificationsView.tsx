import React, { useState } from 'react';
import { Bell, AlertTriangle, ShieldCheck, Radio, Check, Info, ExternalLink, Trash2 } from 'lucide-react';
import { AlertNotification } from '../../types';

interface AlertsNotificationsViewProps {
  alerts: AlertNotification[];
  onDismissAlert?: (id: string) => void;
  onClearAlerts?: () => void;
}

export const AlertsNotificationsView: React.FC<AlertsNotificationsViewProps> = ({
  alerts,
  onDismissAlert,
  onClearAlerts,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'urgent' | 'warning'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'urgent') return a.severity === 'urgent';
    if (filterSeverity === 'warning') return a.severity === 'warning';
    return true;
  });

  const officialBulletins = [
    {
      title: 'IMD National Cyclone Warning Centre (NCWC) Bulletin No. 18',
      date: 'Latest Issued: 03:00 UTC / 08:30 IST',
      category: 'RED WARNING (Landfall Imminent)',
      content:
        'The Severe Cyclonic Storm is centered over North Bay of Bengal. It is very likely to move north-northwestwards and cross north Odisha and West Bengal coasts between Puri and Sagar Island close to Bhitarkanika and Dhamra with a wind speed of 100-110 kmph gusting to 120 kmph.',
      source: 'India Meteorological Department (MoES), New Delhi',
    },
    {
      title: 'MOSDAC SCORPIO Live Cyclogenesis Alert',
      date: 'INSAT-3DS Synchronized Pass',
      category: 'ISRO Satellite Telemetry Advisory',
      content:
        'Convective cloud clusters show prominent curvature with cloud-top brightness temperatures dipping to -82°C in the eyewall region. Scatterometer surface wind vectors confirm sustained gale-force winds exceeding 55 knots within a 90-nautical-mile radius.',
      source: 'ISRO Space Applications Centre (SAC), Ahmedabad',
    },
    {
      title: 'Marine Advisory & Fishermen Warning',
      date: 'Valid for next 72 Hours',
      category: 'TOTAL FISHING SUSPENSION',
      content:
        'Squally wind speed reaching 60-70 kmph gusting to 80 kmph is prevailing over central Bay of Bengal. Fishermen are strictly advised not to venture into deep sea areas of Central and North Bay of Bengal and along and off Odisha and West Bengal coasts.',
      source: 'Coastal Disaster Management Authority',
    },
  ];

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
              Automated MOSDAC SCORPIO alerts, IMD 4-stage cyclone warning system &amp; evacuation directives
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
        {officialBulletins.map((b, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-5 shadow-lg"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h2 className="font-bold text-white text-sm sm:text-base">{b.title}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 self-start sm:self-auto">
                {b.category}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{b.content}</p>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <span className="font-medium text-slate-400">{b.source}</span>
              <span className="font-mono text-cyan-300">{b.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Active Incident Alerts */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Live Real-Time Telemetry Alerts ({filteredAlerts.length})
        </h2>

        <div className="space-y-3">
          {filteredAlerts.length === 0 && <p className="py-6 text-center text-xs text-slate-400">No live alerts match this filter.</p>}
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
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === 'urgent' ? 'bg-rose-500 animate-ping' : 'bg-amber-500'
                    }`}
                  />
                  <h3 className="font-bold text-white text-xs sm:text-sm">{alert.title}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">({alert.timestamp})</span>
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

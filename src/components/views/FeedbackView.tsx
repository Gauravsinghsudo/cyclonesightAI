import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, MapPin, Wind, Waves, AlertTriangle } from 'lucide-react';

export const FeedbackView: React.FC = () => {
  const [observerType, setObserverType] = useState('resident');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Odisha');
  const [windLevel, setWindLevel] = useState('Gale (>60 km/h)');
  const [rainLevel, setRainLevel] = useState('Heavy Downpour');
  const [surgeDepth, setSurgeDepth] = useState('1 - 2 meters');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDistrict('');
      setNotes('');
    }, 4000);
  };

  return (
    <div id="feedback-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Ground Truth &amp; Meteorological Field Observation
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit local coastal barometric pressure, wind gusts, surge inundation depth and storm damage verification
            </p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="rounded-2xl bg-emerald-950/40 border border-emerald-800/80 p-8 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-lg font-bold text-white">Observation Successfully Transmitted</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Thank you for contributing valuable ground truth telemetry. Your observations assist coastal warning
            validation and impact mapping.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-lg space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Observer Category</label>
              <select
                value={observerType}
                onChange={(e) => setObserverType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="resident">Coastal Resident / Citizen</option>
                <option value="meteorologist">Meteorologist / Academic Researcher</option>
                <option value="port_official">Port Official / Marine Pilot</option>
                <option value="disaster_mgmt">Disaster Response Volunteer (NDRF / SDRF)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Coastal State / Province</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="Odisha">Odisha</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Bangladesh">Bangladesh (Chittagong / Barisal)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">District / Coastal Village / Port</label>
              <input
                type="text"
                required
                placeholder="e.g. Bhadrak, Dhamra, Paradip, Digha..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Local Wind Intensity</label>
              <select
                value={windLevel}
                onChange={(e) => setWindLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="Squally (40-50 km/h)">Squally (40-50 km/h)</option>
                <option value="Gale (>60 km/h)">Gale (&gt;60 km/h)</option>
                <option value="Severe Storm (>90 km/h)">Severe Storm (&gt;90 km/h)</option>
                <option value="Violent Destructive (>115 km/h)">Violent Destructive (&gt;115 km/h)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Rainfall Severity</label>
              <select
                value={rainLevel}
                onChange={(e) => setRainLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="Moderate Continuous">Moderate Continuous</option>
                <option value="Heavy Downpour">Heavy Downpour</option>
                <option value="Extreme Torrential Flooding">Extreme Torrential Flooding</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Storm Surge Inundation Depth</label>
              <select
                value={surgeDepth}
                onChange={(e) => setSurgeDepth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5"
              >
                <option value="No noticeable surge">No noticeable surge</option>
                <option value="0.5 - 1.0 meter">0.5 - 1.0 meter</option>
                <option value="1 - 2 meters">1 - 2 meters</option>
                <option value="> 3 meters (Severe Inundation)">&gt; 3 meters (Severe Inundation)</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="text-slate-300 font-medium block mb-1.5">Field Notes / Eyewitness Details</label>
            <textarea
              rows={3}
              placeholder="Describe tree uprooting, power outages, local barometric pressure readings, or breach of saline embankments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Submit Ground Truth Observation</span>
          </button>
        </form>
      )}
    </div>
  );
};

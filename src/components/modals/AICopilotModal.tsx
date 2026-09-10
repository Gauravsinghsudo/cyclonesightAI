import React, { useState } from 'react';
import { X, Bot, Sparkles, Send, CheckCircle, ShieldAlert, Compass } from 'lucide-react';
import { CycloneData } from '../../types';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  cyclones: CycloneData[];
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  cyclones,
}) => {
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Hello Met Admin. CYCLONE SIGHT AI Neural Meteorological Ensemble is operational. I have processed INSAT-3D infrared imagery and GFS/ECMWF guidance. How can I assist your storm analysis today?',
      time: '12:10 PM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Assess CYC-01A Rapid Intensification Risk',
    'Generate Landfall & Storm Surge Advisory',
    'Compare ECMWF vs GFS Track Consensus',
    'Summarize Key Vulnerable Districts',
  ];

  const handleSend = (query?: string) => {
    const text = query || inputText;
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let aiReply = '';
      const lower = text.toLowerCase();

      if (lower.includes('rapid intensification') || lower.includes('ri')) {
        aiReply = `**CYC-01A Rapid Intensification (RI) Analysis:**
• **Probability**: 68% over the next 18–24 hours (RI Index: 78%).
• **Key Drivers**: Sea Surface Temperature (SST) at 30.5°C (>28°C threshold), vertical wind shear < 10 knots, 850-200 hPa upper-level divergent outflow, and 82% mid-tropospheric relative humidity.
• **Projected Peak**: Deepening from 95 km/h to ~195-205 km/h (110 kt) prior to landfall near the Andhra-Odisha corridor.`;
      } else if (lower.includes('landfall') || lower.includes('surge') || lower.includes('advisory')) {
        aiReply = `**Landfall & Storm Surge Advisory:**
• **Primary Target**: Coastal Andhra Pradesh (Machilipatnam - Kalingapatnam stretch) & Southern Odisha.
• **Expected Landfall Window**: Between +48h and +60h from current synoptic hour.
• **Storm Surge**: Inundation of 1.5m to 2.2m above astronomical tide anticipated along low-lying polders.
• **Evacuation Recommendation**: Stage-3 Red Alert evacuation recommended for coastal settlements within 5km of shoreline.`;
      } else if (lower.includes('districts') || lower.includes('vulnerable') || lower.includes('impact')) {
        aiReply = `**Vulnerability Breakdown:**
1. **Coastal Andhra Pradesh (High Risk)**: Srikakulam, Vizianagaram, Visakhapatnam, East Godavari (4.8M residents).
2. **Odisha (High Risk)**: Ganjam, Puri, Jagatsinghpur (3.6M residents).
3. **West Bengal & Sundarbans (Moderate)**: High spring tidal backflow.
4. **Andaman & Nicobar (Moderate)**: Squally gale winds up to 65 km/h from CYC-02B.`;
      } else {
        aiReply = `**Cyclone Intelligence Synthesis:**
Both cyclonic systems (CYC-01A & CYC-02B) remain under continuous 10-minute geostationary radar/satellite tracking. Convective core consolidation on CYC-01A shows tightening inner core radius of maximum wind (RMW) down to 22 km. All 9 automated telemetry sources are transmitting normally with 0% packet loss.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div 
      id="ai-copilot-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl h-[80vh] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">CYCLONE SIGHT AI Copilot</h3>
                <span className="px-1.5 py-0.5 rounded bg-purple-600 text-white text-[10px] font-bold">
                  NEURAL
                </span>
              </div>
              <p className="text-xs text-slate-400">Meteorological intelligence & probabilistic bulletin generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 italic p-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Synthesizing multi-model ensemble forecast...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex gap-2 overflow-x-auto select-none">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              onClick={() => handleSend(qp)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Copilot for cyclone guidance, surge models, or bulletin drafting..."
            className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

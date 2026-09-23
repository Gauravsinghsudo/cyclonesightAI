import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, RotateCcw } from 'lucide-react';
import { CycloneData } from '../../types';
import { UserProfile } from '../../services/authService';
import { useI18n } from '../../i18n';

interface AICopilotViewProps {
  activeCyclone?: CycloneData | null;
  userRole?: UserProfile['role'];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

// The live app can briefly be connected to an older server during a dev-session
// restart. Normalize any legacy Markdown/report response before it reaches the
// chat bubble, so it always reads like a normal message.
function toConversationText(reply: unknown): string {
  if (typeof reply !== 'string') return 'I could not produce a reply just now. Please try again.';
  return reply.trim() || 'I could not produce a reply just now. Please try again.';
}

function splitSummary(text: string): { body: string; summary: string | null } {
  const marker = /\s*(?:quick\s+summary|quick\s+takeaway|executive\s+summary|summary|takeaway)\s*:\s*/i;
  const match = marker.exec(text);
  if (!match || match.index === undefined) return { body: text, summary: null };
  return {
    body: text.slice(0, match.index).trim(),
    summary: text.slice(match.index + match[0].length).trim() || null,
  };
}

const ROLE_CHAT_COPY: Record<NonNullable<UserProfile['role']>, { label: string; welcome: string; placeholder: string }> = {
  public: {
    label: 'Public guidance',
    welcome: 'Hi — I’m CycloBot. I can explain cyclone alerts in simple language and help you understand what you should do to stay safe.',
    placeholder: 'Ask about weather, alerts, or safety…',
  },
  disaster_manager: {
    label: 'Response coordination',
    welcome: 'Hi — I’m CycloBot. I can help you review the active storm, priority areas, response actions, and plain-language public updates.',
    placeholder: 'Ask about priorities, impacts, or response actions…',
  },
  coastal_official: {
    label: 'Coastal operations',
    welcome: 'Hi — I’m CycloBot. I can help with coastal warnings, port conditions, local impacts, and clear operational next steps.',
    placeholder: 'Ask about coastal alerts, ports, or local impacts…',
  },
  meteorologist: {
    label: 'Forecast analysis',
    welcome: 'Hi — I’m CycloBot. I can discuss the active storm, satellite observations, intensity changes, and forecast uncertainty.',
    placeholder: 'Ask about satellite data, track, or intensity…',
  },
  researcher: {
    label: 'Research analysis',
    welcome: 'Hi — I’m CycloBot. I can help interpret cyclone observations, data sources, and uncertainty for your analysis.',
    placeholder: 'Ask about observations, methods, or data…',
  },
};

export const AICopilotView: React.FC<AICopilotViewProps> = ({ activeCyclone, userRole = 'public' }) => {
  const { language, t } = useI18n();
  const roleChat = ROLE_CHAT_COPY[userRole] || ROLE_CHAT_COPY.public;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: roleChat.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const samplePrompts = [
    `Summarize latest official IMD Bulletin for ${activeCyclone?.name || 'the active cyclone'}`,
    `Analyze current landfall point and surge danger for ${activeCyclone?.name || 'the active cyclone'}`,
    'What port warning signals are active in the latest IMD bulletin?',
    'How does MOSDAC SCORPIO evaluate Rapid Intensification (RI) probability?',
    'Explain the differences between IMD Port Warning Signals 8, 9, 10, and 11',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const conversationHistory = messages
      .slice(-12)
      .map(({ sender, text: messageText }) => ({ role: sender, text: messageText }));

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          cycloneContext: activeCyclone,
          conversationHistory,
          userRole,
          language,
        }),
      });

      const data = await res.json();
      const replyText = toConversationText(data.reply);

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to reach the copilot service. Please check connectivity or server status.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-copilot-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              CycloBot
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(userRole === 'meteorologist' ? 'forecastAnalysis' : userRole === 'disaster_manager' ? 'responseCoordination' : userRole === 'coastal_official' ? 'coastalOperations' : userRole === 'researcher' ? 'researchAnalysis' : 'publicGuidance')} in clear, natural language
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-label="AI online" />
          <span className="text-xs text-slate-400">{t('conversationActive')} ·</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800">
            {activeCyclone?.name || 'General Basin'}
          </span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="min-w-0 min-h-0 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col h-[clamp(440px,68dvh,720px)] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 to-transparent">
          {messages.map((m) => {
            const { body, summary } = m.sender === 'assistant' ? splitSummary(m.text) : { body: m.text, summary: null };
            return (
            <div
              key={m.id}
              className={`flex gap-2.5 max-w-[92%] sm:max-w-[78%] ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-blue-400'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`min-w-0 break-words px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {body}
                {summary && (
                  <div className="mt-3.5 p-3.5 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/70 text-slate-100 shadow-md">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Accurate Quick Summary</span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-cyan-50">{summary}</p>
                  </div>
                )}
                <div
                  className={`text-[10px] mt-1.5 ${
                    m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-none bg-slate-800/90 border border-slate-700 text-slate-300 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:240ms]" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompt Shortcuts */}
        <div className="min-w-0 px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="max-w-full px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] whitespace-normal text-left transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
          {messages.length > 1 && (
            <button
              onClick={() => setMessages((current) => current.slice(0, 1))}
              className="ml-auto shrink-0 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Clear chat"
              aria-label="Clear chat"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            placeholder={language === 'en' ? roleChat.placeholder : t('askCopilot')}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

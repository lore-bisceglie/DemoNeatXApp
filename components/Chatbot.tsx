"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_REPLIES = [
  { label: '💰 Quanto costa?', message: 'Quanto costa NeatX?' },
  { label: '📱 Come funziona?', message: 'Come funziona NeatX?' },
  { label: '🎁 Prova gratis', message: 'Posso provarlo gratis?' },
  { label: '🆚 Meglio di Treatwell?', message: 'Perché dovrei scegliere voi invece di Treatwell o Fresha?' },
];

function playNotificationSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio not supported
  }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [proactiveSent, setProactiveSent] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasOpenedRef = useRef(false);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tooltip "Sono un bot" dopo 5s (o al primo scroll) se non ha aperto
  useEffect(() => {
    const show = () => {
      if (!hasOpenedRef.current && !isOpen) {
        setShowTooltip(true);
        tooltipTimerRef.current = setTimeout(() => setShowTooltip(false), 6000);
      }
      window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => show();
    const timer = setTimeout(show, 5000);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isOpen]);

  // Messaggio proattivo dopo 15s se non ha aperto la chat e non ha messaggi
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasOpenedRef.current && !proactiveSent && messages.length === 0) {
        const proactiveMsg: ChatMessage = {
          id: `proactive-${Date.now()}`,
          role: 'assistant',
          content: "Psst... 👋 Sono NeatBot, l'assistente AI. Hai domande su NeatX? Chiedi pure!",
        };
        setMessages([proactiveMsg]);
        setHasNewMessage(true);
        if (!isOpen) playNotificationSound();
        setProactiveSent(true);
      }
    }, 15000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proactiveSent, messages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input quando si apre
  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // Scroll input into view on mobile when focused (prevents keyboard covering it)
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const onFocus = () => {
      if (window.innerWidth < 640) {
        setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'end' }), 300);
      }
    };
    input.addEventListener('focus', onFocus);
    return () => input.removeEventListener('focus', onFocus);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setShowQuickReplies(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "Ops, qualcosa è andato storto. Riprova!",
      };

      setMessages(prev => [...prev, botMessage]);
      if (!isOpen) playNotificationSound();

      if (!isOpen) setHasNewMessage(true);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Mi dispiace, c'è stato un errore di connessione. Riprova tra un attimo! 🔧",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (message: string) => {
    sendMessage(message);
  };

  const messageCount = messages.filter(m => m.role === 'user').length;
  const showCTA = messageCount >= 3;

  return (
    <>
      {/* ═══════════ FLOATING BUTTON ═══════════ */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 z-[9999999] group transition-all duration-500 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} bottom-20 sm:bottom-6`}
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-ping opacity-20" />
          {/* Main button - larger touch target on mobile */}
          <div className="relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-transform duration-150 transform-gpu will-change-transform">
            <MessageCircle size={18} className="sm:size-20" />
          </div>
          {/* New message badge */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
              1
            </span>
          )}
          {/* Tooltip "Sono un bot" - responsive */}
          {showTooltip && !isOpen && (
            <>
              {/* Desktop: a destra del pulsante */}
              <div className="absolute right-14 top-1/2 -translate-y-1/2 sm:right-16 z-50 animate-fade-in hidden sm:block">
                <div className="bg-[#0a0e1a] border border-blue-500/40 rounded-xl px-4 py-2.5 shadow-2xl shadow-blue-900/30 flex items-center gap-2 whitespace-nowrap">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={14} className="text-white" />
                  </span>
                  <span className="text-white text-sm font-medium">Ciao! Sono <span className="text-blue-300">NeatBot</span> 🤖</span>
                  <span className="text-xs text-gray-400 px-2 py-0.5 bg-blue-500/20 rounded-full">Assistente AI</span>
                </div>
                <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-3 border-transparent border-left-blue-500/40" />
              </div>
              {/* Mobile: sopra il pulsante, allineato a destra per non sbordare dallo schermo */}
              <div className="absolute bottom-full mb-3 right-0 z-50 animate-fade-in sm:hidden flex flex-col items-end">
                <div className="bg-[#0a0e1a] border border-blue-500/40 rounded-xl px-3 py-2 shadow-2xl shadow-blue-900/30 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={12} className="text-white" />
                  </span>
                  <span className="text-white text-xs font-medium">Ciao! Sono <span className="text-blue-300">NeatBot</span> 🤖</span>
                </div>
                <div className="mr-[22px] w-0 h-0 border-[6px] border-transparent border-t-blue-500/40" />
              </div>
            </>
          )}
        </div>
      </button>

      {/* ═══════════ CHAT WINDOW ═══════════ */}
      <div
        className={`fixed z-[9999999] transition-all duration-500 ease-out
          inset-0 sm:inset-auto sm:bottom-6 sm:right-6
          w-full sm:w-[360px]
          h-[100dvh] sm:h-[520px] sm:max-h-[80vh] sm:rounded-2xl
          ${isOpen ? 'opacity-100 sm:translate-y-0' : 'opacity-0 sm:translate-y-full pointer-events-none'}
        `}
        style={{ height: '100dvh' }}
      >
        <div className="h-full flex flex-col bg-[#0a0e1a] sm:rounded-2xl border border-gray-800/50 shadow-2xl shadow-blue-900/20 overflow-hidden backdrop-blur-xl">
          
           {/* ═══ HEADER ═══ */}
          <div className="relative px-4 py-3 border-b border-gray-800/50">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated avatar */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-[#0a0e1a]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm tracking-wide">NeatBot</h3>
                  <p className="text-blue-300 text-xs font-medium">Assistente AI · 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 sm:p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all touch-target"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

           {/* ═══ MESSAGES ═══ */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
            {/* Welcome message */}
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-2 max-w-[88%]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm text-gray-200 rounded-2xl rounded-tl-md px-3 py-2 text-xs leading-relaxed border border-gray-700/30">
                  Ciao! 👋 Sono <strong>NeatBot</strong>, l'assistente AI di NeatX. Come posso aiutarti?
                </div>
              </div>
            </div>

            {/* Quick Replies */}
            {showQuickReplies && messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pl-9 animate-fade-in">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr.label}
                    onClick={() => handleQuickReply(qr.message)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-blue-500/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* Chat messages */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                {m.role === 'assistant' ? (
                  <div className="flex gap-2 max-w-[88%]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-gray-800/60 backdrop-blur-sm text-gray-200 rounded-2xl rounded-tl-md px-3 py-2 text-xs leading-relaxed border border-gray-700/30">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%]">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-md px-3 py-2.5 text-xs leading-relaxed shadow-md shadow-blue-500/20">
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start animate-slide-up">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-blue-500/20">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl rounded-tl-md border border-gray-700/30">
                    <TypingDots />
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button after 3+ user messages */}
            {showCTA && !isLoading && (
              <div className="flex justify-center animate-fade-in pt-2">
                <a
                  href="/registrazione"
                  className="px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  🚀 Inizia la Prova Gratuita
                </a>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

           {/* ═══ INPUT ═══ */}
          <form onSubmit={handleSubmit} className="p-2.5 sm:p-3 border-t border-gray-800/50 bg-[#0a0e1a]" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center gap-2 relative">
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi..."
                className="flex-1 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-white text-[16px] sm:text-[14px] rounded-full px-3.5 py-3 sm:py-2 pr-10 sm:pr-12 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-gray-500 transition-all resize-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1 sm:right-1.5 p-2 sm:p-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-30 disabled:hover:shadow-none transition-all duration-300 active:scale-90 touch-target"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                <Send size={16} className="sm:size-14" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ═══ GLOBAL ANIMATIONS & IUBENDA FIX ═══ */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 0.5rem); }
        .touch-target { min-width: 44px; min-height: 44px; }
        
        /* Nasconde il badge fluttuante di Iubenda quando la chat è aperta per evitare sovrapposizioni su mobile */
        ${isOpen ? `
        #iubenda-ibadge, .iubenda-cs-badge, div#iubenda-cs-banner {
          opacity: 0 !important;
          pointer-events: none !important;
          transform: scale(0) !important;
        }
        ` : ''}
      `}</style>
    </>
  );
}

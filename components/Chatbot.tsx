"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';

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
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not supported
  }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input quando si apre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasNewMessage(false);
    }
  }, [isOpen]);

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
      playNotificationSound();

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
        className={`fixed bottom-6 right-6 z-[9999999] group transition-all duration-500 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-ping opacity-20" />
          {/* Main button */}
          <div className="relative p-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-110 transition-all duration-300">
            <MessageCircle size={28} />
          </div>
          {/* New message badge */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
              1
            </span>
          )}
        </div>
      </button>

      {/* ═══════════ CHAT WINDOW ═══════════ */}
      <div
        className={`fixed z-[9999999] transition-all duration-500 ease-out origin-bottom-right
          bottom-0 right-0 sm:bottom-6 sm:right-6
          w-full h-full sm:w-[400px] sm:h-[600px] sm:max-h-[85vh] sm:rounded-2xl
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}
        `}
      >
        <div className="w-full h-full flex flex-col bg-[#0a0e1a] sm:rounded-2xl border border-gray-800/50 shadow-2xl shadow-blue-900/20 overflow-hidden backdrop-blur-xl">
          
          {/* ═══ HEADER ═══ */}
          <div className="relative px-5 py-4 border-b border-gray-800/50">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Animated avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a0e1a]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm tracking-wide">NeatBot</h3>
                  <p className="text-green-400 text-xs font-medium">Online adesso</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ═══ MESSAGES ═══ */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
            {/* Welcome message */}
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-2 max-w-[88%]">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-blue-500/20">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-gray-800/60 backdrop-blur-sm text-gray-200 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed border border-gray-700/30">
                  Ciao! 👋 Sono <strong>NeatBot</strong>, il consulente virtuale di NeatX. Sono qui per aiutarti a scoprire come automatizzare il tuo salone e dire addio ai no-show. Che tipo di attività gestisci?
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
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-blue-500/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400 transition-all duration-200 hover:scale-105 active:scale-95"
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
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-blue-500/20">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-gray-800/60 backdrop-blur-sm text-gray-200 rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed border border-gray-700/30">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%]">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-md px-4 py-3 text-sm leading-relaxed shadow-md shadow-blue-500/20">
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
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-blue-500/20">
                    <Bot size={14} className="text-white" />
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
                  className="px-5 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  🚀 Inizia la Prova Gratuita
                </a>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ═══ INPUT ═══ */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800/50 bg-[#0a0e1a]">
            <div className="flex items-center gap-2 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Scrivi un messaggio..."
                className="flex-1 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-white text-[16px] sm:text-sm rounded-full px-4 py-3 pr-12 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-gray-500 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 p-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-30 disabled:hover:shadow-none transition-all duration-300 active:scale-90"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-center text-gray-600 text-[10px] mt-2">
              Powered by NeatX AI · Risponde 24/7
            </p>
          </form>
        </div>
      </div>

      {/* ═══ GLOBAL ANIMATIONS ═══ */}
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
      `}</style>
    </>
  );
}

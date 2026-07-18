"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Target, Dumbbell, Shield, Bot, User, Trash2 } from "lucide-react";

type Message = { role: "user" | "model"; content: string };

const BOTS = [
  {
    id: "competitor-spy",
    name: "Spia Competitor",
    icon: Target,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    desc: "Analizza recensioni negative altrui e crea hook pubblicitari."
  },
  {
    id: "sales-sparring",
    name: "Franco (Simulatore Vendite)",
    icon: Dumbbell,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    desc: "Barbiere di 55 anni scettico sulla tecnologia. Prova a vendergli NeatX."
  },
  {
    id: "onboarding-concierge",
    name: "Onboarding Concierge",
    icon: Shield,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    desc: "Scrive mail di benvenuto perfette in base al mestiere del cliente."
  }
];

export default function SuperadminAISuite() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);

  const [activeBot, setActiveBot] = useState(BOTS[0]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/superadmin/list")
      .then((response) => setIsAuthenticated(response.ok))
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) {
        setError("Password errata. Riprova.");
        return;
      }
      setPassword("");
      setIsAuthenticated(true);
      setError("");
    } catch {
      setError("Errore di connessione. Riprova.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeBot]);

  const activeMessages = conversations[activeBot.id] || [];

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    
    const newHistory = [...activeMessages, { role: "user" as const, content: userMsg }];
    
    setConversations(prev => ({
      ...prev,
      [activeBot.id]: newHistory
    }));
    
    setIsLoading(true);

    try {
      const res = await fetch("/api/superadmin/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          botId: activeBot.id,
          messages: newHistory
        }),
      });

      const data = await res.json();
      
      setConversations(prev => ({
        ...prev,
        [activeBot.id]: [...newHistory, { role: "model" as const, content: data.reply }]
      }));
    } catch (err) {
      setConversations(prev => ({
        ...prev,
        [activeBot.id]: [...newHistory, { role: "model" as const, content: "Errore di connessione col server AI." }]
      }));
    }

    setIsLoading(false);
  };

  const clearChat = () => {
    setConversations(prev => ({ ...prev, [activeBot.id]: [] }));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center px-4 font-sans">
        <div className="text-slate-400">Verifica accesso...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center px-4 font-sans">
        <form onSubmit={handleLogin} className="bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] shadow-2xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-[#00b4ff]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="text-[#00b4ff]" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Accesso Riservato</h1>
          <p className="text-slate-400 text-sm mb-6">NeatX AI Suite - Solo Personale Autorizzato</p>
          
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Inserisci password superadmin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131c31] border border-[#1a2642] rounded-xl px-4 py-3 pr-10 text-white text-center tracking-widest focus:outline-none focus:border-[#00b4ff]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
          
          <button type="submit" className="w-full bg-[#00b4ff] text-[#050814] font-extrabold py-3 rounded-xl hover:bg-cyan-400 transition-colors">
            Sblocca Terminale
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-slate-300 font-sans flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-[#0b1221] border-r border-[#1a2642] flex flex-col">
        <div className="p-6 border-b border-[#1a2642]">
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Bot className="text-[#00b4ff]" /> NeatX AI Team
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Quartier Generale</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {BOTS.map(bot => {
            const BotIcon = bot.icon;
            return (
            <button
              key={bot.id}
              onClick={() => setActiveBot(bot)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                activeBot.id === bot.id 
                  ? 'bg-[#131c31] border-[#00b4ff]/50 shadow-[0_0_15px_-3px_rgba(0,180,255,0.2)]' 
                  : 'bg-transparent border-transparent hover:bg-[#131c31]/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-xl ${bot.bg}`}>
                  <BotIcon className={bot.color} size={20} />
                </div>
                <div className="font-bold text-white text-sm">{bot.name}</div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{bot.desc}</p>
            </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-screen relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00b4ff]/5 via-[#050814] to-[#050814]">
        {/* Header Chat */}
        <div className="h-20 border-b border-[#1a2642] flex items-center justify-between px-6 bg-[#050814]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${activeBot.bg}`}>
              {(() => { const ActiveIcon = activeBot.icon; return <ActiveIcon className={activeBot.color} size={24} />; })()}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">{activeBot.name}</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs text-slate-400 font-medium">Online e pronto operativo</span>
              </div>
            </div>
          </div>
          {activeMessages.length > 0 && (
            <button onClick={clearChat} className="text-slate-500 hover:text-red-400 transition flex items-center gap-2 text-sm font-bold bg-[#131c31] px-3 py-2 rounded-lg border border-[#1a2642] hover:border-red-900/50">
              <Trash2 size={16} /> Reset
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              {(() => { const ActiveIcon = activeBot.icon; return <ActiveIcon size={64} className={`mb-6 ${activeBot.color}`} />; })()}
              <h3 className="text-2xl font-bold text-white mb-2">Inizia la sessione</h3>
              <p className="text-slate-400 max-w-md">Digita il tuo primo messaggio in basso per attivare l'agente {activeBot.name}.</p>
            </div>
          ) : (
            activeMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${activeBot.bg} border ${activeBot.border}`}>
                    {(() => { const ActiveIcon = activeBot.icon; return <ActiveIcon className={activeBot.color} size={20} />; })()}
                  </div>
                )}
                
                <div className={`max-w-[75%] rounded-2xl p-5 text-sm md:text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#00b4ff] text-[#050814] font-medium rounded-tr-sm' 
                    : 'bg-[#131c31] border border-[#1a2642] text-slate-200 rounded-tl-sm shadow-xl'
                }`}>
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-slate-800 border border-slate-700">
                    <User className="text-slate-400" size={20} />
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${activeBot.bg} border ${activeBot.border}`}>
                {(() => { const ActiveIcon = activeBot.icon; return <ActiveIcon className={activeBot.color} size={20} />; })()}
              </div>
              <div className="bg-[#131c31] border border-[#1a2642] rounded-2xl rounded-tl-sm p-5 shadow-xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00b4ff] animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-[#00b4ff] animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 rounded-full bg-[#00b4ff] animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-6 bg-[#050814] border-t border-[#1a2642]">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e as any);
                }
              }}
              placeholder={`Scrivi un messaggio a ${activeBot.name}...`}
              className="w-full bg-[#0b1221] border border-[#1a2642] rounded-2xl px-5 py-4 pr-16 text-white text-sm md:text-base focus:outline-none focus:border-[#00b4ff] resize-none custom-scrollbar min-h-[60px] max-h-[200px]"
              rows={1}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 p-2.5 bg-[#00b4ff] text-[#050814] rounded-xl hover:bg-cyan-400 disabled:opacity-50 transition-all"
            >
              <Send size={20} />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              NeatX AI Model - Uso Interno Riservato
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

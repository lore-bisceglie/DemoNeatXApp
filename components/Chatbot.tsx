"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Tasto fluttuante per aprire la chat */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-transform z-50 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Finestra della Chat */}
      <div
        className={`fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">Assistente NeatX</h3>
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Online
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messaggi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Messaggio di benvenuto */}
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-200 rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%] text-sm">
              Ciao! 👋 Sono l'assistente virtuale di NeatX. Come posso aiutarti a svoltare la gestione del tuo salone?
            </div>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-2xl px-4 py-2 max-w-[85%] text-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-2 text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Sto scrivendo...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800 bg-gray-900 rounded-b-2xl">
          <div className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Scrivi un messaggio..."
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-full px-4 py-2.5 pr-10 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!input || isLoading}
              className="absolute right-1.5 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

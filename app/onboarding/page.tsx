"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  
  // Stati per il successo
  const [successData, setSuccessData] = useState<{slug: string, password: string} | null>(null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && name.trim().length > 2) {
      setStep(2);
    }
  };

  const handleCreate = async (selectedTemplate: string) => {
    setTemplate(selectedTemplate);
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, template: selectedTemplate }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore sconosciuto");
      }

      // Finto caricamento AI per effetto WOW (2.5 secondi)
      setTimeout(() => {
        setIsGenerating(false);
        setSuccessData({ slug: data.slug, password: data.password });
        setStep(3); // Step 3 = Schermata di Successo
      }, 2500);

    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-6 text-white text-center font-sans">
        <div className="relative flex justify-center items-center mb-8">
          <div className="absolute w-32 h-32 border-4 border-[#1a2642] border-t-[#00b4ff] rounded-full animate-spin"></div>
          <div className="absolute w-24 h-24 border-4 border-[#1a2642] border-b-purple-500 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
          <span className="text-4xl">🤖</span>
        </div>
        <h2 className="text-3xl font-extrabold mb-3">L'IA sta assemblando l'App</h2>
        <p className="text-slate-400 font-medium animate-pulse max-w-sm">
          Stiamo configurando il database, i servizi per "{name}" e attivando il sistema WhatsApp...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col p-6 text-slate-200 font-sans selection:bg-[#00b4ff]/30 relative overflow-hidden">
      {/* GLOW */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#00b4ff]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="flex items-center gap-2 mb-12 relative z-10">
        <span className="text-xl font-extrabold text-white">Neat</span>
        <span className="text-[#00b4ff] text-xl font-extrabold">X</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto relative z-10">
        
        {step === 1 && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Come si chiama <br className="hidden md:block"/> la tua attività?
            </h1>
            <p className="text-slate-400 mb-8 text-lg">Iniziamo dalle basi. Il nome apparirà sulla tua App.</p>
            
            <form onSubmit={handleNext} className="w-full">
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                placeholder="es. Studio Dentistico Rossi"
                className="w-full bg-transparent border-b-2 border-slate-700 text-3xl md:text-4xl text-white font-bold pb-4 focus:outline-none focus:border-[#00b4ff] transition-colors placeholder:text-slate-700"
              />
              <button 
                type="submit" 
                disabled={name.trim().length < 3}
                className="mt-10 px-8 py-4 bg-white text-black hover:bg-[#00b4ff] hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black font-extrabold rounded-full transition-all text-lg flex items-center gap-2"
              >
                Continua →
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="w-full animate-in fade-in slide-in-from-right-8 duration-700">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Che tipo di <br className="hidden md:block"/> servizi offri?
            </h1>
            <p className="text-slate-400 mb-8 text-lg">Seleziona la tua categoria per pre-caricare i servizi sull'app.</p>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 font-bold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'barbiere', icon: '✂️', title: 'Barbiere / Parrucchiere' },
                { id: 'estetista', icon: '💅', title: 'Centro Beauty / SPA' },
                { id: 'psicologo', icon: '🛋️', title: 'Psicologo / Consulente' },
                { id: 'generico', icon: '📅', title: 'Altro Professionista' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCreate(cat.id)}
                  className="bg-[#0b1221] hover:bg-[#131c31] border border-[#1a2642] hover:border-[#00b4ff]/50 p-6 rounded-3xl transition-all flex flex-col items-start gap-4 group text-left"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                  <span className="text-white font-bold text-lg">{cat.title}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setStep(1)}
              className="mt-10 text-slate-500 hover:text-white font-medium transition-colors"
            >
              ← Torna indietro
            </button>
          </div>
        )}

        {step === 3 && successData && (
          <div className="w-full animate-in fade-in zoom-in duration-700 max-w-lg mx-auto bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] shadow-2xl">
            <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center text-3xl mb-6 border border-green-500/20">
              ✓
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">App Pronta! 🎉</h1>
            <p className="text-slate-400 mb-8 font-medium">Non perdere questa schermata. Segui queste 3 istruzioni semplicissime per iniziare:</p>
            
            <div className="space-y-6 mb-8">
              
              {/* PASSO 1 */}
              <div className="bg-[#050814] p-5 rounded-2xl border border-[#1a2642] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                <div className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
                  <span className="bg-cyan-500 text-black px-2 py-0.5 rounded-md text-xs">1</span> 
                  Metti questo Link su Instagram
                </div>
                <p className="text-xs text-slate-400 mb-3">I tuoi clienti cliccheranno qui per prenotare.</p>
                <div className="text-cyan-400 font-medium break-all bg-[#0b1221] p-3 rounded-xl border border-[#1a2642] flex justify-between items-center">
                  neatx.com/t/{successData.slug}
                </div>
              </div>
              
              {/* PASSO 2 */}
              <div className="bg-[#050814] p-5 rounded-2xl border border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <div className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
                  <span className="bg-purple-500 text-white px-2 py-0.5 rounded-md text-xs">2</span> 
                  La Tua Dashboard Segreta 🔒
                </div>
                <p className="text-xs text-slate-400 mb-3">Solo per te: qui gestirai incassi e appuntamenti.</p>
                <div className="text-white font-medium mb-3 break-all bg-[#0b1221] p-3 rounded-xl border border-[#1a2642]">
                  neatx.com/t/{successData.slug}/admin
                </div>
                <div className="flex justify-between items-center bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                  <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest">Password:</span>
                  <span className="font-mono text-xl text-yellow-400 font-bold tracking-widest select-all">{successData.password}</span>
                </div>
              </div>

              {/* PASSO 3 */}
              <div className="bg-[#050814] p-5 rounded-2xl border border-[#1a2642] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="text-sm font-extrabold text-white mb-1 flex items-center gap-2">
                  <span className="bg-emerald-500 text-black px-2 py-0.5 rounded-md text-xs">3</span> 
                  Installala sul Telefono 📱
                </div>
                <p className="text-xs text-slate-400">
                  Quando aprirai la tua Dashboard dal cellulare, clicca su <strong>"Condividi"</strong> (iPhone) o sui <strong>"Tre puntini"</strong> (Android) e premi <strong>"Aggiungi alla schermata Home"</strong> per usarla come una vera App!
                </p>
              </div>

            </div>

            <Link 
              href={`/t/${successData.slug}/admin`}
              className="w-full py-5 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 text-white font-extrabold rounded-2xl transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:scale-[1.02]"
            >
              Ho capito, portami alla Dashboard →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

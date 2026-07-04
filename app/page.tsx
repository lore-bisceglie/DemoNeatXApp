"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import FloatingPhone from "@/components/landing/FloatingPhone";
import BeforeAfterSlider from "@/components/landing/BeforeAfterSlider";
import StripeMockup from "@/components/landing/StripeMockup";
import ReviewSimulator from "@/components/landing/ReviewSimulator";

const FAKE_NOTIFICATIONS = [
  "🔥 Marco R. ha appena prenotato un Taglio",
  "💸 Giulia ha versato 50€ di anticipo",
  "✅ Il Dott. Bianchi ha azzerato i No-Show",
  "🚀 Nuovo cliente iscritto a NeatX",
  "📅 Prenotazione confermata per le 15:30",
];

export default function Home() {
  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  
  // ROI Calculator State
  const [showRoiModal, setShowRoiModal] = useState(false);
  
  // Stripe Demo State
  const [showStripe, setShowStripe] = useState(false);
  
  const [clientsPerMonth, setClientsPerMonth] = useState(300);
  const [avgTicket, setAvgTicket] = useState(35);
  
  // Math: 15% average no-show rate in the industry
  const noShowRate = 0.15;
  const lostRevenue = Math.round(clientsPerMonth * avgTicket * noShowRate);
  // NeatX saves about 90% of those no-shows
  const recoveredRevenue = Math.round(lostRevenue * 0.90);


  // Glow Effect Mouse Tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Social Proof: Live Notifications
  useEffect(() => {
    const showRandomNotification = () => {
      const randomText = FAKE_NOTIFICATIONS[Math.floor(Math.random() * FAKE_NOTIFICATIONS.length)];
      setNotification(randomText);
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 4000); // Nasconde dopo 4 secondi

      // Prossima notifica tra 10 e 20 secondi
      setTimeout(showRandomNotification, Math.random() * 10000 + 10000);
    };

    const timer = setTimeout(showRandomNotification, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-[#00b4ff]/30 overflow-x-hidden relative">
      
      {/* MOCKUP STRIPE CHECKOUT */}
      {showStripe && (
        <StripeMockup 
          amount={10.00} 
          onSuccess={() => {
            setShowStripe(false);
            window.location.href = "/demo";
          }}
          onCancel={() => setShowStripe(false)}
        />
      )}
      
      
        <style>{`
          .glow-card {
            position: relative;
            z-index: 1;
          }
          .glow-card::before {
            content: "";
            position: absolute;
            top: -1px; left: -1px; right: -1px; bottom: -1px;
            border-radius: inherit;
            background: radial-gradient(
              600px circle at var(--mouse-x) var(--mouse-y), 
              rgba(0, 180, 255, 0.15),
              transparent 40%
            );
            z-index: -1;
            opacity: 0;
            transition: opacity 0.5s;
          }
          .glow-card:hover::before {
            opacity: 1;
          }
        `}</style>
        
        {/* GLOW BACKGROUND EFFETTO DINAMICO */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#00b4ff]/10 blur-[150px] rounded-full pointer-events-none opacity-60 animate-pulse" />

      {/* NAVBAR */}
      <nav className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-2xl font-extrabold tracking-tight">
          <span className="text-white">Neat</span>
          <span className="text-[#00b4ff]">X</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Funzionalità</a>
          <button onClick={() => setShowRoiModal(true)} className="hover:text-white transition-colors font-extrabold text-[#00b4ff]">Calcola ROI</button>
          <a href="#pricing" className="hover:text-white transition-colors">Prezzi</a>
          <Link href="/blog" className="hover:text-white transition-colors text-purple-400">Blog</Link>
        </div>
        
      </nav>

      {/* HERO SECTION CON MOCKUP TILT */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 md:pt-20 pb-20 flex flex-col items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-extrabold tracking-widest uppercase mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:bg-cyan-500/20 transition-all cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          L'App N.1 in Italia per Saloni
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          L'Agenda Intelligente per <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b4ff] to-purple-500 animate-pulse">
            Professionisti Top
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Il tuo tempo ha un valore. Smetti di perderlo al telefono. Trasforma i tuoi follower in clienti paganti con l'app di prenotazione n.1 in Italia.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 relative z-20">
          <Link 
            href="/demo"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#00b4ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-2xl shadow-[0_0_40px_-10px_rgba(0,180,255,0.6)] transition-all text-lg flex items-center justify-center gap-2 hover:scale-105 hover:-translate-y-1"
          >
            Esplora la Demo 🚀
          </Link>
          <button 
            onClick={() => setShowRoiModal(true)}
            className="w-full sm:w-auto px-8 py-4 bg-[#131c31]/80 backdrop-blur-md hover:bg-[#1a2642] border border-[#1e2b4a] text-white font-extrabold rounded-2xl transition-all text-lg flex items-center justify-center gap-2 hover:border-[#00b4ff]/50 shadow-lg shadow-cyan-900/10"
          >
            Simula i tuoi incassi 💸
          </button>
        </div>

        <div className="mt-16 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-8 relative z-20">
          
          {/* 3D FLOATING IPHONE */}
          <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
            <FloatingPhone />
          </div>
          
          {/* 3D GLASSMORPHISM MOCKUP */}
          <div className="w-full lg:w-2/3 relative animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 delay-500 perspective-1000">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00b4ff] to-purple-600 rounded-3xl blur-[80px] opacity-20 animate-pulse"></div>
          <div className="relative w-full aspect-video bg-[#0b1221]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col transform hover:rotate-x-12 hover:scale-[1.02] transition-all duration-700 ease-out group cursor-crosshair">
            
            {/* Header Mockup */}
            <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-black/20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="mx-auto bg-black/40 px-32 py-1 rounded-md text-[10px] text-slate-500 font-mono tracking-widest border border-white/5">
                neatx.com/admin
              </div>
            </div>

            {/* Body Mockup */}
            <div className="flex-1 p-6 flex flex-col gap-6 relative">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Incassi Mese</div>
                  <div className="text-4xl font-extrabold text-white">€ 4.250,00 <span className="text-[#00b4ff] text-xl">↑ 24%</span></div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div> Live
                </div>
              </div>
              
              <div className="flex-1 flex items-end gap-2 px-4 h-full relative">
                {/* Linee di sfondo grafico */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                  <div className="border-b border-white w-full h-0"></div>
                  <div className="border-b border-white w-full h-0"></div>
                  <div className="border-b border-white w-full h-0"></div>
                </div>
                {/* Barre grafiche animate */}
                {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-[#00b4ff]/20 to-[#00b4ff]/80 rounded-t-md border-t border-[#00b4ff] relative group-hover:bg-[#00b4ff] transition-all duration-500 ease-in-out" style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}>
                  </div>
                ))}
              </div>
            </div>

          </div>
          </div>
        </div>
      </main>

      {/* INFINITE MARQUEE (TRUSTED BY) */}
      <div className="w-full bg-[#050814] border-y border-[#1a2642] py-4 overflow-hidden relative z-10 flex">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050814] to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050814] to-transparent z-10"></div>
        
        <div className="flex animate-marquee w-max">
          <div className="flex items-center gap-16 px-8 min-w-max text-slate-500 font-extrabold tracking-widest uppercase text-sm">
            <span>Trusted By 100+ Professionals</span>
            <span>✦</span>
            <span className="text-white">Barbieri Top</span>
            <span>✦</span>
            <span>Centri Estetici</span>
            <span>✦</span>
            <span className="text-[#00b4ff]">Studi Medici</span>
            <span>✦</span>
            <span>Consulenti</span>
            <span>✦</span>
            <span className="text-purple-400">Tattoo Studios</span>
            <span>✦</span>
          </div>
          {/* Duplicato per scroll continuo perfetto */}
          <div className="flex items-center gap-16 px-8 min-w-max text-slate-500 font-extrabold tracking-widest uppercase text-sm">
            <span>Trusted By 100+ Professionals</span>
            <span>✦</span>
            <span className="text-white">Barbieri Top</span>
            <span>✦</span>
            <span>Centri Estetici</span>
            <span>✦</span>
            <span className="text-[#00b4ff]">Studi Medici</span>
            <span>✦</span>
            <span>Consulenti</span>
            <span>✦</span>
            <span className="text-purple-400">Tattoo Studios</span>
            <span>✦</span>
          </div>
        </div>
      </div>

      {/* SLIDER PRIMA E DOPO */}
      <BeforeAfterSlider />
      
      {/* FEATURES SECTION */}
      <section id="features" className="relative z-10 bg-[#0b1221] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Perché scegliere NeatX?</h2>
            <p className="text-slate-400 font-medium">Creato su misura per chi vende il proprio tempo.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glow-card bg-[#050814] p-8 rounded-3xl border border-[#1a2642] shadow-2xl group hover:border-[#00b4ff]/50 transition-all duration-300">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📱</div>
              <h3 className="text-xl font-extrabold text-white mb-3">La Tua App Dedicata</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Niente piattaforme caotiche con i tuoi competitor di fianco. Ai tuoi clienti dai un link pulito, brandizzato con il tuo nome, solo tuo.</p>
            </div>
            
            <div className="glow-card bg-[#050814] p-8 rounded-3xl border border-[#1a2642] shadow-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px]"></div>
              <div className="text-4xl mb-6 relative z-10 group-hover:scale-110 transition-transform">🤖</div>
              <h3 className="text-xl font-extrabold text-white mb-3 relative z-10">Zero No-Show</h3>
              <p className="text-slate-400 leading-relaxed text-sm relative z-10">Il nostro bot invia promemoria automatici via WhatsApp ai tuoi clienti, abbattendo drasticamente le assenze dell'ultimo minuto.</p>
            </div>

            <div className="glow-card bg-[#050814] p-8 rounded-3xl border border-[#1a2642] shadow-2xl group hover:border-emerald-500/50 transition-all duration-300">
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">💸</div>
              <h3 className="text-xl font-extrabold text-white mb-3">Anticipi & Pagamenti</h3>
              <p className="text-slate-400 leading-relaxed text-sm">Chiedi una caparra per i servizi più costosi. I pagamenti sono integrati con Stripe/PayPal direttamente in fase di prenotazione.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATORE INCASSO ANTICIPATO (FLUTTUANTE & TILT) */}
      <section className="relative z-10 bg-[#050814] py-32 border-t border-[#1a2642] overflow-hidden">
        {/* CSS Animazioni Universali */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes float-slow {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(1deg); }
          }
          @keyframes float-fast {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(-1deg); }
          }
          @keyframes orbit {
            0% { transform: rotate(0deg) translateX(200px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(200px) rotate(-360deg); }
          }
          .animate-float-slow { animation: float-slow 7s ease-in-out infinite; }
          .animate-float-fast { animation: float-fast 5s ease-in-out infinite; }
          .animate-orbit { animation: orbit 20s linear infinite; }
          .tilt-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
          .tilt-card:hover { transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateY(-5px); }
        `}} />

        {/* Ambient Lights Orbitanti */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-[1px]">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full animate-orbit"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center justify-center">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Azzera i <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">No-Show.</span>
            </h2>
            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
              Richiedi acconti o pagamenti completi in anticipo tramite Stripe o PayPal, direttamente integrati nella tua app. Niente più perdite di tempo e denaro.
            </p>
          </div>

          <div className="tilt-card animate-float-slow w-full max-w-3xl bg-[#0a0f1c]/80 backdrop-blur-xl p-10 md:p-14 rounded-[40px] border border-white/5 hover:border-cyan-500/40 relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,180,255,0.2)] flex flex-col items-center text-center">
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full group-hover:bg-cyan-500/20 transition-all duration-700"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-5xl mb-8 shadow-[inset_0_0_30px_rgba(0,180,255,0.2)] animate-pulse">💳</div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Simulatore Incasso Acconti</h3>
              <p className="text-slate-300 leading-relaxed text-lg mb-10 max-w-xl mx-auto">
                Vuoi vedere in prima persona come i tuoi clienti pagheranno l'acconto dal loro telefono? 
                Provalo tu stesso (è un finto checkout interattivo).
              </p>
              <button 
                onClick={() => setShowStripe(true)}
                className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold py-5 px-12 rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto w-full sm:w-auto text-xl"
              >
                <span>💰</span>
                Simula Pagamento
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATORE RECENSIONI GOOGLE */}
      <ReviewSimulator />

      {/* PRICING SECTION */}
      <section id="pricing" className="relative z-10 bg-[#050814] py-24 border-y border-[#1a2642]">
        <div className="max-w-6xl mx-auto px-6">
          
          <div className="mb-20 max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/10 to-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-[60px]"></div>
            <h2 className="text-3xl font-extrabold text-white mb-3 relative z-10">0% Commissioni. <span className="text-emerald-400">Zero trattenute.</span></h2>
            <p className="text-emerald-100/70 font-medium relative z-10 text-lg">
              A differenza delle altre piattaforme che si tengono il 20-30% sui tuoi incassi, con NeatX i soldi sono tutti tuoi. Paghi solo l'abbonamento mensile, e basta.
            </p>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Scegli il piano per il tuo Salone</h2>
            <p className="text-slate-400 font-medium">L'investimento più intelligente per la tua attività.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
            {/* PIANO STARTER */}
            <div className="glow-card bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] flex flex-col h-[450px] transform transition-transform hover:scale-105">
              <h3 className="text-xl font-bold text-slate-300 mb-2">Starter</h3>
              <div className="text-4xl font-extrabold text-white mb-1">19€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
              <div className="text-xs text-slate-500 font-medium mb-6">+ Setup Una Tantum iniziale</div>
              <ul className="space-y-4 mb-auto text-sm text-slate-400 font-medium">
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Link pubblico di prenotazione</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> 100 appuntamenti/mese</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Supporto via Email</li>
              </ul>
              <a 
                href="mailto:info@neatx.it?subject=Candidatura%20Piano%20Starter&body=Ciao%21%20Vorrei%20candidarmi%20per%20il%20Piano%20Starter.%20Ecco%20i%20dati%20per%20aiutarvi%20a%20strutturare%20la%20mia%20agenda%20su%20misura%3A%0A%0A1.%20Nome%20del%20Salone%2FStudio%3A%20%0A%0A2.%20Quanti%20membri%20dello%20staff%20ci%20lavorano%3F%20%0A%0A3.%20Quali%20sono%20i%20vostri%20orari%20di%20apertura%20e%20chiusura%3F%20%0A%0A4.%20Quali%20sono%20i%20giorni%20di%20chiusura%20settimanale%3F%20%0A%0A5.%20Elenca%20i%20tuoi%20servizi%20principali%20%28con%20durata%20e%20prezzo%20stimati%29%3A%20%0A%0A6.%20Vuoi%20richiedere%20un%20anticipo%2Fcaparra%20al%20momento%20della%20prenotazione%3F%20%0A%0A7.%20Qual%20%C3%A8%20il%20problema%20pi%C3%B9%20grande%20che%20hai%20oggi%20con%20la%20gestione%20degli%20appuntamenti%3F%20%0A%0AIn%20attesa%20di%20un%20vostro%20riscontro."
                className="mt-8 w-full block py-4 border border-[#1e2b4a] hover:bg-[#131c31] text-white font-bold rounded-xl transition-all text-center"
              >
                📝 Invia Candidatura
              </a>
            </div>

            {/* PIANO PRO (EVIDENZIATO) */}
            <div className="bg-[#0b1221] p-8 rounded-3xl border border-[#00b4ff] shadow-[0_0_30px_-5px_rgba(0,180,255,0.3)] relative flex flex-col h-[500px] md:-mt-8 transform transition-transform hover:scale-105 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#00b4ff] to-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
                Più Scelto
              </div>
              <h3 className="text-xl font-bold text-[#00b4ff] mb-2">Pro</h3>
              <div className="text-5xl font-extrabold text-white mb-1">29€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
              <div className="text-xs text-slate-500 font-medium mb-6">+ Setup Una Tantum iniziale</div>
              <ul className="space-y-4 mb-auto text-sm text-slate-200 font-medium">
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Appuntamenti Illimitati</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> <strong className="text-white">Promemoria Email Gratuiti</strong></li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Integrazione SMS Automatica*</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Blocco orari e ferie</li>
              </ul>
              <a 
                href="mailto:info@neatx.it?subject=Candidatura%20Piano%20Pro&body=Ciao%21%20Vorrei%20candidarmi%20per%20il%20Piano%20Pro.%20Ecco%20i%20dati%20per%20aiutarvi%20a%20strutturare%20la%20mia%20agenda%20su%20misura%3A%0A%0A1.%20Nome%20del%20Salone%2FStudio%3A%20%0A%0A2.%20Quanti%20membri%20dello%20staff%20ci%20lavorano%3F%20%0A%0A3.%20Quali%20sono%20i%20vostri%20orari%20di%20apertura%20e%20chiusura%3F%20%0A%0A4.%20Quali%20sono%20i%20giorni%20di%20chiusura%20settimanale%3F%20%0A%0A5.%20Elenca%20i%20tuoi%20servizi%20principali%20%28con%20durata%20e%20prezzo%20stimati%29%3A%20%0A%0A6.%20Vuoi%20richiedere%20un%20anticipo%2Fcaparra%20al%20momento%20della%20prenotazione%3F%20%0A%0A7.%20Qual%20%C3%A8%20il%20problema%20pi%C3%B9%20grande%20che%20hai%20oggi%20con%20la%20gestione%20degli%20appuntamenti%3F%20%0A%0AIn%20attesa%20di%20un%20vostro%20riscontro."
                className="mt-8 w-full block py-4 bg-gradient-to-r from-[#00b4ff] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold rounded-xl transition-all text-center shadow-lg shadow-cyan-500/25 hover:scale-105"
              >
                📝 Invia Candidatura
              </a>
            </div>

            {/* PIANO ELITE */}
            <div className="glow-card bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] flex flex-col h-[450px] transform transition-transform hover:scale-105">
              <h3 className="text-xl font-bold text-purple-400 mb-2">Elite</h3>
              <div className="text-4xl font-extrabold text-white mb-1">59€ <span className="text-sm text-slate-500 font-medium">/ mese</span></div>
              <div className="text-xs text-slate-500 font-medium mb-6">+ Setup Una Tantum iniziale</div>
              <ul className="space-y-4 mb-auto text-sm text-slate-400 font-medium">
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Tutto quello che c'è nel PRO</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Gestione Multi-Staff</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Assistenza Prioritaria H24</li>
              </ul>
              <div className="mt-8 flex flex-col gap-3">
                <a 
                  href="mailto:info@neatx.it?subject=Candidatura%20Piano%20Elite&body=Ciao%21%20Vorrei%20candidarmi%20per%20il%20Piano%20Elite.%20Ecco%20i%20dati%20per%20aiutarvi%20a%20strutturare%20la%20mia%20agenda%20su%20misura%3A%0A%0A1.%20Nome%20del%20Salone%2FStudio%3A%20%0A%0A2.%20Quanti%20membri%20dello%20staff%20ci%20lavorano%3F%20%0A%0A3.%20Quali%20sono%20i%20vostri%20orari%20di%20apertura%20e%20chiusura%3F%20%0A%0A4.%20Quali%20sono%20i%20giorni%20di%20chiusura%20settimanale%3F%20%0A%0A5.%20Elenca%20i%20tuoi%20servizi%20principali%20%28con%20durata%20e%20prezzo%20stimati%29%3A%20%0A%0A6.%20Vuoi%20richiedere%20un%20anticipo%2Fcaparra%20al%20momento%20della%20prenotazione%3F%20%0A%0A7.%20Qual%20%C3%A8%20il%20problema%20pi%C3%B9%20grande%20che%20hai%20oggi%20con%20la%20gestione%20degli%20appuntamenti%3F%20%0A%0AIn%20attesa%20di%20un%20vostro%20riscontro."
                  className="w-full py-4 block bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-extrabold rounded-xl transition-all text-center shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-105"
                >
                  📝 Invia Candidatura
                </a>
              </div>
            </div>
          </div>
          
          {/* BANNER TRASPARENZA SMS */}
          <div className="mt-12 max-w-4xl mx-auto bg-[#0a0f1c] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
            <div className="text-4xl">💎</div>
            <div className="text-left">
              <h4 className="text-white font-bold text-lg mb-1">* Trasparenza 100% sui costi dei messaggi</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tutti i piani includono le notifiche via Email gratuite e illimitate. Se desideri usare gli <strong>SMS automatici</strong> per azzerare i no-show, il servizio si paga <em>esclusivamente a consumo</em> (ricarica crediti). 
                Noi usiamo la rete ufficiale mondiale e non applichiamo margini nascosti. Paghi esattamente quello che spedisci, e decidi tu il tuo budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE SOCIAL PROOF NOTIFICATION */}
      <div 
        className={`fixed bottom-6 left-6 z-50 bg-[#131c31]/95 backdrop-blur-md border border-[#1e2b4a] shadow-2xl shadow-cyan-900/20 p-4 rounded-2xl flex items-center gap-4 transform transition-all duration-500 ease-out ${
          showNotification ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-ping flex-shrink-0"></div>
        <p className="text-white text-sm font-bold m-0 p-0 leading-none">
          {notification}
        </p>
      </div>


      {/* ROI CALCULATOR MODAL */}
      {showRoiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0b1221] border border-[#00b4ff]/40 p-6 sm:p-8 rounded-3xl shadow-2xl shadow-cyan-900/30 max-w-lg w-full relative animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setShowRoiModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white bg-[#131c31] w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">💸</div>
              <h3 className="text-2xl font-extrabold text-white mb-2">Quanti soldi perdi per i No-Show?</h3>
              <p className="text-slate-400 text-sm">Scopri quanto incasso extra genererai attivando i promemoria automatici NeatX.</p>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-bold text-slate-300">Clienti al mese</label>
                  <span className="text-xl font-extrabold text-[#00b4ff]">{clientsPerMonth}</span>
                </div>
                <input 
                  type="range" 
                  min="50" max="1000" step="50"
                  value={clientsPerMonth}
                  onChange={(e) => setClientsPerMonth(Number(e.target.value))}
                  className="w-full accent-[#00b4ff] h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-sm font-bold text-slate-300">Scontrino medio</label>
                  <span className="text-xl font-extrabold text-emerald-400">{avgTicket} €</span>
                </div>
                <input 
                  type="range" 
                  min="10" max="150" step="5"
                  value={avgTicket}
                  onChange={(e) => setAvgTicket(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-2 bg-[#131c31] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-[#050814] rounded-2xl border border-[#1a2642] p-5 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-400 text-sm font-medium">Perdita attuale stimata (15% assenze):</span>
                <span className="text-red-400 font-bold line-through">-{lostRevenue} €/mese</span>
              </div>
              
              <div className="h-px w-full bg-[#1a2642] my-4"></div>
              
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-500 mb-1">IL TUO RECUPERO CON NEATX</div>
                  <div className="text-slate-300 text-xs">Ricavi extra stimati 🚀</div>
                </div>
                <div className="text-3xl font-extrabold text-white">
                  +{recoveredRevenue} <span className="text-lg text-slate-500">€/m</span>
                </div>
              </div>
            </div>

            <Link 
              href="#pricing"
              onClick={() => setShowRoiModal(false)}
              className="w-full block text-center py-4 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-emerald-900/40 hover:scale-105"
            >
              Voglio questi {recoveredRevenue}€ in più
            </Link>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-10 w-full bg-[#050814] border-t border-[#1a2642]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="text-xl font-extrabold tracking-tight">
              <span className="text-white">Neat</span>
              <span className="text-[#00b4ff]">X</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-slate-400">
              <a href="https://www.iubenda.com/privacy-policy/32937890" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="https://www.iubenda.com/privacy-policy/32937890/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-[#1a2642] to-transparent mb-8"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium text-center md:text-left">
            <div>
              © {new Date().getFullYear()} NeatX Software. Tutti i diritti riservati.<br/>
              <span className="text-slate-600">Progettato per elevare il settore del benessere.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistemi Operativi
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

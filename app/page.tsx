"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 🌟 DEFINIAMO COME È FATTO UN SERVIZIO
type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export default function Home() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState("");
  
  const [honey, setHoney] = useState("");
  const [demoModal, setDemoModal] = useState({ show: false, date: "", time: "", serviceName: "" });
  const [isHoliday, setIsHoliday] = useState(false);
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [tenantInfo] = useState({
    id: "cmq9aubwu0000936e9e4wt68j",
    name: "Appuntamenti Demo NeatX",
    address: "📍 Via dell'Innovazione, 1 - Milano (MI)",
    phone: "390000000000",
    isDemo: true
  });

  useEffect(() => {
    fetch(`/api/services?tenantId=${tenantInfo.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.services && data.services.length > 0) {
          setServices(data.services);
          setSelectedService(data.services[0]); 
        }
      })
      .catch((err) => console.error("Errore servizi:", err));
  }, [tenantInfo.id]);

  useEffect(() => {
    if (!date || !selectedService) return; 
    
    const d = new Date(date);
    const day = d.getDay();
    
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(d.getDate()).padStart(2, '0');
    const giornoMese = `${dayOfMonth}-${month}`; 
    
    const festeNazionali = [
      "01-01", "06-01", "25-04", "01-05", "02-06", 
      "15-08", "01-11", "08-12", "25-12", "26-12"
    ];

    if (day === 0 || day === 1) {
      setDateError("La domenica e il lunedì sono chiuso! Scegli un altro giorno.");
      setSlots([]); 
      setIsHoliday(false);
      return; 
    } else if (festeNazionali.includes(giornoMese)) {
      setDateError("Il salone è chiuso in questa data per festività nazionale!");
      setSlots([]); 
      setIsHoliday(false);
      return; 
    } else {
      setDateError(""); 
    }
    
    setLoading(true);
    fetch(`/api/availability?date=${date}&tenantId=${tenantInfo.id}&duration=${selectedService.duration}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
        setLoading(true);
    fetch(`/api/availability?date=${date}&tenantId=${tenantInfo.id}&duration=${selectedService.duration}`)
      .then((res) => res.json())
      .then((data) => {
        let fetchedSlots = data.slots || [];

        // 🛡️ FILTRO ANTI-VIAGGIO NEL TEMPO
        const now = new Date();
        // Calcola la data locale di oggi (YYYY-MM-DD)
        const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];

        // Se la data selezionata è oggi, applichiamo il filtro
        if (date === localToday) {
          const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

          fetchedSlots = fetchedSlots.filter((slot: string) => {
            const [hours, minutes] = slot.split(":").map(Number);
            const slotTotalMinutes = hours * 60 + minutes;

            // Mostra l'orario SOLO se mancano almeno 30 minuti da adesso
            return slotTotalMinutes >= currentTotalMinutes + 30;
          });
        }

        setSlots(fetchedSlots);
        setIsHoliday(data.isHoliday || false); 
        setSelectedSlot("");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Errore di connessione:", error);
        setSlots([]);
        setIsHoliday(false);
        setLoading(false);
      });isHoliday(data.isHoliday || false); 
        setSelectedSlot("");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Errore di connessione:", error);
        setSlots([]);
        setIsHoliday(false);
        setLoading(false);
      });
  }, [date, tenantInfo.id, selectedService]); 

  const handleBook = async () => {
    if (!name || !phone || !selectedSlot || !selectedService) {
      alert("Per favore, compila tutti i campi.");
      return;
    }

    if (dateError || isHoliday) return; 

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        customerName: name, 
        customerPhone: phone, 
        date, 
        time: selectedSlot, 
        honey,
        tenantId: tenantInfo.id,
        serviceId: selectedService.id 
      }),
    });

    if (res.ok) {
      if (tenantInfo.isDemo) {
        setDemoModal({ show: true, date: date, time: selectedSlot, serviceName: selectedService.name });
        setName("");
        setPhone("");
        setSelectedSlot("");
        setHoney(""); 
        setSlots([]); 
        return;
      }

      if (phone === "0000") {
        router.push("/dashboard");
        return;
      }

      const [year, month, day] = date.split("-");
      const italianDate = `${day}/${month}/${year}`;
      const cleanPhone = phone.replace(/\D/g, "");
      const shopPhone = tenantInfo.phone; 
      
      const text = encodeURIComponent(
        `✂️ *Nuova Prenotazione!*\n\n` +
        `👤 *Cliente:* ${name}\n` +
        `📞 *Telefono:* ${cleanPhone}\n` +
        `💇‍♂️ *Servizio:* ${selectedService.name}\n` +
        `📅 *Data:* ${italianDate}\n` +
        `⏰ *Ora:* ${selectedSlot}\n\n` +
        `_Prenotazione gestita tramite NeatX._ 🚀`
      );

      window.location.href = `https://wa.me/${shopPhone}?text=${text}`;

      setName("");
      setPhone("");
      setSelectedSlot("");
      setDate(today);
      setSlots([]);
      setHoney(""); 
    } else {
      const errorData = await res.json();
      alert(errorData.error || "Si è verificato un errore, riprova!");
    }
  };

  const isButtonDisabled = dateError !== "" || isHoliday || slots.length === 0;

  // 🌟 MESSAGGIO PRECOMPILATO WHATSAPP PER TE (Sostituisci il numero se serve)
  const whatsappMessage = encodeURIComponent("Ciao Lorenzo! Ho visto la tua app NeatX e vorrei informazioni.");
  const myPhoneNumber = "393480480942"; // INSERISCI QUI IL TUO NUMERO REALE

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center py-10 px-4 font-sans text-slate-200 selection:bg-cyan-500/30">
      
      {demoModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity">
          <div className="bg-[#0b1221] border border-[#00b4ff]/30 p-8 rounded-3xl shadow-2xl shadow-cyan-900/20 max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Prenotazione Simulata</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Hai finto di prenotare <strong>{demoModal.serviceName}</strong> per il <strong>{demoModal.date.split("-").reverse().join("/")}</strong> alle <strong>{demoModal.time}</strong>.<br /><br />
              Nella realtà, i dati verrebbero inviati al database e saresti reindirizzato a WhatsApp per la conferma finale.
            </p>
            <button 
              onClick={() => setDemoModal({ show: false, date: "", time: "", serviceName: "" })}
              className="w-full bg-[#131c31] hover:bg-[#1a2642] text-white border border-[#1e2b4a] hover:border-[#00b4ff]/50 font-bold py-3 rounded-xl transition shadow-lg"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      {tenantInfo.isDemo && (
        <div className="max-w-md w-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-xs text-center p-2 rounded-xl mb-4 font-semibold uppercase tracking-wide">
          ⚠️ Ambiente Demo - Dati fittizi
        </div>
      )}

      <div className="bg-[#0b1221] max-w-md w-full rounded-3xl shadow-2xl shadow-cyan-900/10 border border-[#1a2642] p-6 sm:p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3 flex justify-center items-center gap-3 flex-wrap">
            <Link href="/dashboard" className="cursor-pointer hover:text-slate-300 transition">
              {tenantInfo.name}
            </Link>
          </h1>
          
          <a 
            href="https://maps.app.goo.gl/wzDPqhcyqcRsxbC99" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-400 hover:text-[#00b4ff] transition flex items-center justify-center gap-1"
          >
            {tenantInfo.address}
          </a>
        </div>

        {/* BOTTONE INSTAGRAM DEL CLIENTE */}
        <div className="flex justify-center mb-8">
          <a 
            href="https://instagram.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-lg shadow-pink-500/20 transition-all transform hover:scale-105"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
            Seguici su Instagram
          </a>
        </div>

        {services.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-slate-300">Scegli il servizio</label>
            <select 
              value={selectedService?.id || ""} 
              onChange={(e) => {
                const s = services.find(srv => srv.id === e.target.value);
                setSelectedService(s || null);
                setSlots([]); 
                setSelectedSlot("");
              }} 
              className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition"
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name} ({srv.duration} min) - {srv.price}€
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-slate-300">Scegli il giorno</label>
          <input 
            type="date" 
            value={date} 
            min={today} 
            onChange={(e) => setDate(e.target.value)} 
            className={`w-full bg-[#131c31] border ${dateError ? 'border-red-500' : 'border-[#1e2b4a]'} text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition`} 
            style={{ colorScheme: "dark" }}
          />
          {dateError && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2">
              <span>[!]</span> {dateError}
            </div>
          )}
        </div>

        {isHoliday ? (
          <div className="mb-6 bg-orange-500/10 border border-orange-500/20 text-orange-400 p-6 rounded-2xl text-center shadow-inner">
            <span className="text-4xl mb-2 block">🏖️</span>
            <h3 className="font-extrabold text-lg mb-1 text-white">Siamo in Ferie!</h3>
            <p className="text-sm font-medium">Il salone è chiuso in questa data. Per favore, seleziona un altro giorno dal calendario.</p>
          </div>
        ) : (
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-slate-300">Orari disponibili</label>
            {loading ? (
              <p className="text-slate-400 text-sm">Caricamento orari...</p>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-1 rounded-xl text-sm font-bold transition-all border ${
                      selectedSlot === slot
                        ? "bg-[#00b4ff] text-[#050814] border-[#00b4ff] shadow-md shadow-cyan-500/20 transform scale-105"
                        : "bg-[#131c31] text-slate-300 border-[#1e2b4a] hover:border-[#00b4ff]/50 hover:bg-[#1a2642]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Nessun orario disponibile</p>
            )}
          </div>
        )}

        <div className="mb-6 space-y-3">
          <input 
            type="text" 
            placeholder="Il tuo nome" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition" 
            disabled={isHoliday}
          />
          <input 
            type="tel" 
            placeholder="Il tuo numero (WhatsApp)" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition" 
            disabled={isHoliday}
          />
          
          <input 
            type="text" 
            value={honey} 
            onChange={(e) => setHoney(e.target.value)} 
            className="hidden" 
            tabIndex={-1} 
            autoComplete="off"
          />
        </div>

        <button 
          onClick={handleBook} 
          disabled={isButtonDisabled}
          className={`w-full font-bold py-3 rounded-xl transition shadow-lg ${
            isButtonDisabled 
              ? "bg-[#131c31] text-slate-500 cursor-not-allowed shadow-none border border-[#1e2b4a]" 
              : "bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] shadow-cyan-500/20"
          }`}
        >
          ✓ Prenota Ora
        </button>
        
        <p className="text-[10px] text-slate-500 mt-5 text-center">
          Verrai reindirizzato a WhatsApp per confermare.
        </p>

      </div>

      {/* 🌟 FOOTER CON I TUOI NUOVI LINK */}
      <div className="bg-[#0b1221] max-w-md w-full rounded-3xl shadow-xl shadow-cyan-900/5 border border-[#1a2642] p-5 mt-6 text-center flex flex-col items-center gap-3">
        <p className="text-[10px] text-slate-400 tracking-wide">
          Powered by <span className="font-bold text-slate-300">Neat</span><span className="font-bold text-[#00b4ff]">X</span> <br/> 
          Developed by <span className="text-[#00b4ff]/90 font-semibold">Bisceglie Lorenzo</span>
        </p>
        
        <Link href="/dashboard" className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition cursor-pointer">
          AREA GESTIONE
        </Link>

        {/* I DUE BOTTONI COME DA FOTO */}
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
          <a href="https://www.instagram.com/lorebisceglie?igsh=cTIzeG15aXEzZ2Ey&utm_source=qr" target="_blank" rel="noopener noreferrer" className="hover:text-[#00b4ff] transition cursor-pointer">
            INSTAGRAM
          </a>
          <span className="text-slate-600">•</span>
          <a 
            href={`https://wa.me/${myPhoneNumber}?text=${whatsappMessage}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#00b4ff] transition cursor-pointer"
          >
            WHATSAPP
          </a>
        </div>
      </div>

    </div>
  );
}
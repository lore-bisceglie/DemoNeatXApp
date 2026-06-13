export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReminderButton from "./ReminderButton";
import DeleteButton from "./DeleteButton";
import { unstable_noStore as noStore } from 'next/cache';

export default async function Dashboard({ searchParams }: { searchParams: { error?: string } }) {
  noStore();

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = dateFormatter.formatToParts(now);
  const day = parts.find(p => p.type === 'day')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const year = parts.find(p => p.type === 'year')?.value;
  const todayItaly = `${year}-${month}-${day}`;

  const timeFormatter = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hour12: false });
  const currentTimeItaly = timeFormatter.format(now);
  const [currentHours, currentMinutes] = currentTimeItaly.split(':').map(Number);
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  const rawAppointments = await prisma.appointment.findMany({
    where: { date: { gte: todayItaly } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    include: {
      service: true
    }
  });

  const appointments = rawAppointments.filter((app) => {
    if (app.date > todayItaly) return true;
    if (app.time === "ALL_DAY") return true;
    const [appHours, appMinutes] = app.time.split(':').map(Number);
    const appTotalMinutes = appHours * 60 + appMinutes;
    return currentTotalMinutes <= appTotalMinutes + 30;
  });

  const nextAppointment = appointments.find(app => !app.customerName.includes("☕ PAUSA") && !app.customerName.includes("🌴 FERIE")) || null;
  const currentClosures = appointments.filter(app => app.customerName.includes("☕ PAUSA") || app.customerName.includes("🌴 FERIE"));

  const allSlots = [
    "09:00", "09:15", "09:30", "09:45", "10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45", "12:00",
    "14:00", "14:15", "14:30", "14:45", "15:00", "15:15", "15:30", "15:45", "16:00", "16:15", "16:30", "16:45", "17:00", "17:15", "17:30", "17:45", "18:00", "18:15", "18:30", "18:45", "19:00"
  ];

  async function blockTimeRange(formData: FormData) {
    "use server";
    const date = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    
    if (date && startTime && endTime) {
      const startIndex = allSlots.indexOf(startTime);
      const endIndex = allSlots.indexOf(endTime);

      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        for (let i = startIndex; i < endIndex; i++) {
          await prisma.appointment.create({
            data: { customerName: "☕ PAUSA", customerPhone: "0000000000", date, time: allSlots[i] }
          });
        }
      }
    }
    redirect("/dashboard");
  }

  async function blockHoliday(formData: FormData) {
    "use server";
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const loop = new Date(start);

      while (loop <= end) {
        const d = loop.toISOString().split("T")[0];
        await prisma.appointment.create({
          data: { customerName: "🌴 FERIE", customerPhone: "0000000000", date: d, time: "ALL_DAY" }
        });
        loop.setDate(loop.getDate() + 1);
      }
    }
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col p-4 sm:p-8 font-sans text-slate-200 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto w-full flex-grow">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="text-white">Neat</span><span className="text-[#00b4ff]">X</span> <span className="text-slate-500 font-medium text-2xl ml-2">| Dashboard Privata NeatX</span>
          </h1>
          <Link href="/" className="bg-[#00b4ff] hover:bg-cyan-400 text-[#050814] text-sm font-bold px-5 py-2.5 rounded-full shadow-lg shadow-cyan-500/20 transition flex items-center gap-2">
            [+] Nuova Prenotazione
          </Link>
        </div>

        {/* 🚨 BANNER DI ERRORE SCUDI 🚨 */}
        {searchParams.error === "SCUDO_PAUSA_ATTIVO" && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-red-900/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-red-500/20 p-2 rounded-xl text-red-400 text-xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-400">Impossibile bloccare l'orario</h3>
              <p className="text-sm text-slate-300">C'è già un cliente prenotato in quella fascia oraria! Sposta prima l'appuntamento.</p>
            </div>
          </div>
        )}

        {searchParams.error === "SCUDO_FERIE_ATTIVO" && (
          <div className="mb-8 bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-orange-900/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-orange-500/20 p-2 rounded-xl text-orange-400 text-xl">🌴</div>
            <div>
              <h3 className="font-bold text-orange-400">Impossibile inserire le ferie</h3>
              <p className="text-sm text-slate-300">Hai degli appuntamenti segnati in quei giorni! Disdici i clienti prima di chiudere il salone.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          
          {/* COLONNA 1: PROSSIMO CLIENTE */}
          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] flex flex-col justify-center h-full">
            <h2 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Prossimo in arrivo
            </h2>
            {nextAppointment ? (
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-2xl font-extrabold text-white truncate max-w-[200px]">{nextAppointment.customerName}</p>
                  <p className="text-[#00b4ff] font-bold text-lg">{nextAppointment.time} <span className="text-sm font-medium text-slate-400 ml-1">({nextAppointment.date.split('-').reverse().join('/')})</span></p>
                  {nextAppointment.service && (
                    <p className="text-sm text-slate-300 font-medium mt-1 truncate max-w-[200px]">
                      ✨ {nextAppointment.service.name} ({nextAppointment.service.duration} min)
                    </p>
                  )}
                </div>
                <div className="bg-[#131c31] p-4 rounded-2xl border border-[#1e2b4a] text-2xl shadow-inner">
                  ⏳
                </div>
              </div>
            ) : (
              <p className="text-slate-500 font-medium italic mt-4">Nessun cliente in attesa.</p>
            )}
          </div>

          {/* COLONNA 2: CREA CHIUSURE */}
          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-red-900/5 border border-[#1a2642] flex flex-col justify-center h-full">
            <h2 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
              <span>⚙️</span> Gestione Chiusure
            </h2>

            <div className="mb-4 pb-4 border-b border-[#1e2b4a]">
              <h3 className="text-[10px] text-slate-400 font-bold uppercase mb-2">☕ Blocca Orari (Da - A)</h3>
              <form action={blockTimeRange} className="flex gap-2 w-full">
                <input type="date" name="date" required defaultValue={todayItaly} className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-red-500/50 text-sm w-[40%]" style={{ colorScheme: "dark" }} />
                
                <select name="startTime" required className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-red-500/50 text-sm w-[20%]">
                  <option value="">Dalle</option>
                  {allSlots.map(slot => <option key={`start-${slot}`} value={slot}>{slot}</option>)}
                </select>

                <select name="endTime" required className="bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-red-500/50 text-sm w-[20%]">
                  <option value="">Alle</option>
                  {allSlots.map(slot => <option key={`end-${slot}`} value={slot}>{slot}</option>)}
                </select>

                <button type="submit" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold px-3 py-2 rounded-xl transition text-sm w-[20%]">Blocca</button>
              </form>
            </div>

            <div>
              <h3 className="text-[10px] text-orange-400 font-bold uppercase mb-2">🌴 Ferie (Dal - Al)</h3>
              <form action={blockHoliday} className="flex gap-2 w-full">
                <input type="date" name="startDate" required defaultValue={todayItaly} className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-orange-500/50 text-sm" style={{ colorScheme: "dark" }} />
                <input type="date" name="endDate" required defaultValue={todayItaly} className="w-full bg-[#131c31] border border-[#1e2b4a] text-white rounded-xl px-2 py-2 focus:outline-none focus:border-orange-500/50 text-sm" style={{ colorScheme: "dark" }} />
                <button type="submit" className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-bold px-3 py-2 rounded-xl transition text-sm">Salva</button>
              </form>
            </div>
          </div>

          {/* COLONNA 3: CHIUSURE ATTIVE */}
          <div className="bg-[#0b1221] p-6 rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] h-full overflow-y-auto max-h-[350px]">
            <h2 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
              <span>[!]</span> Chiusure Attive
            </h2>
            {currentClosures.length > 0 ? (
              <div className="space-y-3">
                {currentClosures.map(app => {
                  const [year, month, day] = app.date.split("-");
                  const italianDate = `${day}/${month}/${year}`;
                  const isFerie = app.customerName.includes("🌴 FERIE");
                  
                  return (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-[#131c31] rounded-2xl border border-[#1e2b4a]">
                      <div>
                        <p className={`font-bold text-sm ${isFerie ? 'text-orange-400' : 'text-red-400'}`}>{app.customerName}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          {italianDate} • {app.time === "ALL_DAY" ? "TUTTO IL GIORNO" : app.time}
                        </p>
                      </div>
                      <DeleteButton appointmentId={app.id} customerName={app.customerName} phone="0000000000" date={italianDate} time={app.time} isSpecial={true} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic text-center mt-6">Nessuna chiusura attiva. L'agenda è libera.</p>
            )}
          </div>
        </div>

        {/* LISTA APPUNTAMENTI */}
        <div className="bg-[#0b1221] rounded-3xl shadow-xl shadow-cyan-900/10 border border-[#1a2642] overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#0b1221] to-[#131c31] border-b border-[#1e2b4a]">
            <h2 className="text-lg font-bold text-white">Appuntamenti</h2>
          </div>
          <div className="divide-y divide-[#1e2b4a]">
            {appointments.length > 0 ? (
              appointments.map((app) => {
                const isSpecial = app.customerName.includes("☕ PAUSA") || app.customerName.includes("🌴 FERIE");
                const [year, month, day] = app.date.split("-");
                const italianDate = `${day}/${month}/${year}`;
                const displayTime = app.time === "ALL_DAY" ? "TUTTO IL GIORNO" : app.time;

                if (isSpecial) return null;

                return(
                <div key={app.id} className="p-6 flex items-center justify-between transition hover:bg-[#131c31]/50">
                  <div>
                    <p className="font-bold text-white">{app.customerName}</p>
                    <p className="text-slate-400 text-sm">
                      <span className="font-bold text-[#00b4ff]">{displayTime}</span> • {italianDate}
                    </p>
                    {app.service && (
                      <p className="text-xs text-slate-300 mt-1 font-medium">
                        ✨ {app.service.name} ({app.service.duration} min)
                      </p>
                    )}
                    {app.customerPhone !== "0000000000" && (
                      <p className="text-cyan-400 text-sm mt-1">{app.customerPhone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <ReminderButton name={app.customerName} date={italianDate} time={app.time} phone={app.customerPhone} />
                    <DeleteButton appointmentId={app.id} customerName={app.customerName} phone={app.customerPhone} date={italianDate} time={displayTime} isSpecial={false} />
                  </div>
                </div>
              )})
            ) : (
              <div className="p-6 text-center text-slate-500">
                <p>Nessun appuntamento in programma.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
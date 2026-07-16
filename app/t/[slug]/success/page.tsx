import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { CheckCircle2, CalendarPlus, MapPin, Phone, ArrowLeft } from "lucide-react";

export default async function SuccessPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const sessionId = searchParams.session_id as string;
  const appId = searchParams.app_id as string;

  let isValid = false;
  let appointment = null;

  if (sessionId && appId) {
    try {
      // Se è il nostro mock fallback
      if (sessionId.startsWith("mock_")) {
        isValid = true;
      } else {
        // Verifica con Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session && session.payment_status === "paid") {
          isValid = true;
        }
      }

      if (isValid) {
        // Aggiorna lo stato nel DB a PAGATO
        await prisma.appointment.updateMany({
          where: { id: appId },
          data: { paymentStatus: "PAID", isPaid: true }
        });
      }
    } catch (err) {
      console.error("Errore verifica sessione Stripe", err);
    }
  }

  if (appId) {
    try {
      // Recupera i dettagli per mostrare il riepilogo (indipendentemente da stripe)
      appointment = await prisma.appointment.findUnique({
        where: { id: appId },
        include: {
          service: true,
          staff: true,
          tenant: true,
          location: true
        }
      });
    } catch (err) {
      console.error("Errore nel recupero appuntamento", err);
    }
  }

  // Generazione Link Google Calendar
  let googleCalLink = "";
  let dateFormatted = "";
  if (appointment && appointment.service) {
    const start = new Date(`${appointment.date}T${appointment.time}:00`);
    const end = new Date(start.getTime() + appointment.service.duration * 60000);
    
    // Formato YYYYMMDDTHHMMSSZ
    const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g,"");
    
    const text = `Appuntamento: ${appointment.service.name}`;
    const locationStr = appointment.location?.address || appointment.tenant?.address || "";
    const details = `Prenotazione confermata presso ${appointment.tenant?.name || "il salone"}.`;
    
    googleCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${formatCalDate(start)}/${formatCalDate(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(locationStr)}`;
    
    dateFormatted = start.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0b1221] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in zoom-in duration-500 mb-6">
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          {isValid ? "Pagamento Riuscito!" : "Prenotazione Effettuata"}
        </h1>
        
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {isValid 
            ? "Abbiamo ricevuto il tuo pagamento online. La prenotazione è confermata e il salone ti aspetta." 
            : "La tua prenotazione è confermata. Pagherai direttamente in salone."}
        </p>

        {appointment && appointment.service && (
          <div className="bg-[#131c31] border border-[#1e2b4a] rounded-2xl p-5 mb-6 text-left">
            <h3 className="font-bold text-white text-lg mb-4 border-b border-[#1e2b4a] pb-3">Riepilogo</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Servizio</p>
                <p className="text-white font-medium">{appointment.service.name} ({appointment.service.duration} min)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Data</p>
                  <p className="text-white font-medium capitalize">{dateFormatted}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Orario</p>
                  <p className="text-white font-medium">{appointment.time}</p>
                </div>
              </div>
              {appointment.staff && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Operatore</p>
                  <p className="text-white font-medium">{appointment.staff.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {appointment && appointment.service && (
            <a 
              href={googleCalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-[#131c31] hover:bg-[#1a2642] border border-cyan-500/30 text-cyan-400 font-bold rounded-2xl transition"
            >
              <CalendarPlus size={20} />
              Aggiungi a Google Calendar
            </a>
          )}

          <Link 
            href={`/t/${slug}`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition"
          >
            <ArrowLeft size={20} />
            Torna al Negozio
          </Link>
          
          {isValid && (
            <Link 
              href={`/t/${slug}/admin`}
              className="block w-full py-3 bg-transparent hover:bg-white/5 text-slate-400 text-sm font-medium rounded-xl transition"
            >
              {sessionId?.startsWith("mock_") ? "Torna in Dashboard (Demo)" : "Vai in Dashboard"}
            </Link>
          )}
        </div>
      </div>

      {appointment && (appointment.location?.address || appointment.tenant?.address || appointment.location?.phone || appointment.tenant?.phone) && (
        <div className="max-w-md w-full bg-[#0b1221] border border-[#1a2642] rounded-2xl p-5 text-slate-300 text-sm">
          <h4 className="font-bold text-white mb-3">Info Salone</h4>
          <div className="space-y-2">
            {(appointment.location?.address || appointment.tenant?.address) && (
              <p className="flex items-center gap-3">
                <MapPin size={16} className="text-cyan-500 flex-shrink-0" />
                <span>{appointment.location?.address || appointment.tenant?.address}</span>
              </p>
            )}
            {(appointment.location?.phone || appointment.tenant?.phone) && (
              <p className="flex items-center gap-3">
                <Phone size={16} className="text-cyan-500 flex-shrink-0" />
                <span>{appointment.location?.phone || appointment.tenant?.phone}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

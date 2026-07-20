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
  let appointment = appId
    ? await prisma.appointment.findFirst({
        where: { id: appId, tenant: { slug } },
        include: {
          service: true,
          staff: true,
          tenant: { include: { storeSettings: true } },
          location: { include: { settings: true } },
        },
      })
    : null;

  if (sessionId && appointment && appointment.stripeSession === sessionId) {
    try {
      // Se è il nostro mock fallback
      const stripeAccountId =
        appointment.location?.settings?.stripeAccountId ||
        appointment.tenant?.storeSettings?.stripeAccountId;
      if (stripeAccountId && !stripeAccountId.startsWith("acct_demo_")) {
        const session = await stripe.checkout.sessions.retrieve(
          sessionId,
          {},
          { stripeAccount: stripeAccountId }
        );
        isValid = Boolean(
          session.payment_status === "paid" &&
          session.metadata?.type === "appointment_deposit" &&
          session.metadata?.appointmentId === appointment.id &&
          session.metadata?.tenantSlug === slug
        );
      }

      if (isValid) {
        // Aggiorna lo stato nel DB a PAGATO
        await prisma.appointment.updateMany({
          where: { id: appointment.id, stripeSession: sessionId },
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
      appointment = await prisma.appointment.findFirst({
        where: { id: appId, tenant: { slug } },
        include: {
          service: true,
          staff: true,
          tenant: { include: { storeSettings: true } },
          location: { include: { settings: true } },
        }
      });
    } catch (err) {
      console.error("Errore nel recupero appuntamento", err);
    }
  }

  isValid = isValid || Boolean(appointment?.isPaid && appointment.paymentStatus === "PAID");

  // Generazione Link Google Calendar + file .ics universale
  let googleCalLink = "";
  let icsDataUri = "";
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

    // File .ics universale (Apple Calendar, Outlook, Samsung Calendar, ecc.)
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//NeatX//Prenotazioni//IT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `DTSTART:${formatCalDate(start)}`,
      `DTEND:${formatCalDate(end)}`,
      `SUMMARY:${text}`,
      `DESCRIPTION:${details.replace(/,/g, "\\,")}`,
      `LOCATION:${locationStr.replace(/,/g, "\\,")}`,
      `STATUS:CONFIRMED`,
      `BEGIN:VALARM`,
      `TRIGGER:-PT1H`,
      `ACTION:DISPLAY`,
      `DESCRIPTION:Promemoria appuntamento tra 1 ora`,
      `END:VALARM`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    icsDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
    
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
            <>
              <a 
                href={icsDataUri}
                download={`appuntamento-${appointment.date}.ics`}
                className="flex items-center justify-center gap-2 w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition shadow-[0_0_20px_rgba(0,180,255,0.15)]"
              >
                <CalendarPlus size={20} />
                Aggiungi al Calendario
              </a>
              <a 
                href={googleCalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#131c31] hover:bg-[#1a2642] border border-[#1e2b4a] text-slate-400 hover:text-slate-300 text-sm font-medium rounded-2xl transition"
              >
                <CalendarPlus size={16} />
                oppure apri in Google Calendar
              </a>
            </>
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
              Vai in Dashboard
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

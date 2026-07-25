import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { CheckCircle2, CalendarPlus, MapPin, Phone, ArrowLeft, MessageCircle } from "lucide-react";

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
    // Determina l'offset UTC di Europe/Rome per la data specifica
    function getRomeUtcOffset(dateStr: string, timeStr: string): number {
      const trialDate = new Date(`${dateStr}T12:00:00`);
      const tzName = Intl.DateTimeFormat('en', { timeZone: 'Europe/Rome', timeZoneName: 'short' })
        .formatToParts(trialDate)
        .find(p => p.type === 'timeZoneName')?.value;
      return tzName === 'CEST' ? 120 : 60; // CEST = UTC+2, CET = UTC+1
    }

    const romeOffset = getRomeUtcOffset(appointment.date, appointment.time);
    const [h, m] = appointment.time.split(':').map(Number);
    const [y, mo, d] = appointment.date.split('-').map(Number);

    // Converti ora Rome in UTC sottraendo l'offset (CEST=+120, CET=+60 minuti)
    const startUtc = new Date(Date.UTC(y, mo - 1, d, h, m - romeOffset, 0));
    const endUtc = new Date(startUtc.getTime() + appointment.service.duration * 60000);

    // Formato YYYYMMDDTHHMMSSZ (sempre UTC)
    const formatCalDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const text = `Appuntamento: ${appointment.service.name}`;
    const locationStr = appointment.location?.address || appointment.tenant?.address || "";
    const details = `Prenotazione confermata presso ${appointment.tenant?.name || "il salone"}.`;
    
    googleCalLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${formatCalDate(startUtc)}/${formatCalDate(endUtc)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(locationStr)}`;

    icsDataUri = `/api/calendar/${appointment.id}`;
    
    dateFormatted = startUtc.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'long' });
  }

  let waLink = "";
  if (appointment && appointment.service && !isValid) {
    const cancelUrl = `https://www.neatx.store/cancel/${appointment.cancelToken}`;
    const priceString = appointment.service.price ? ` (${appointment.service.price}€)` : "";

    const confirmText = `📅 *Nuova Prenotazione!*\n\n` +
      `👤 *Cliente:* ${appointment.customerName}\n` +
      `📱 *Telefono:* ${appointment.customerPhone || "Non inserito"}\n` +
      `📅 *Data:* ${appointment.date.split("-").reverse().join("/")}\n` +
      `⏰ *Ora:* ${appointment.time}\n` +
      `📌 *Servizio:* ${appointment.service.name}${priceString}\n` +
      `💳 *Pagamento:* in salone\n\n` +
      `❌ *Per annullare in autonomia:*\n` +
      `Puoi usare questo link fino a 2 ore prima dell'appuntamento:\n${cancelUrl}\n\n` +
      `_Prenotazione gestita tramite NeatX._ 🚀`;

    const tenantPhone = appointment.location?.phone || appointment.tenant?.phone || "";
    const cleanPhone = tenantPhone.replace(/\D/g, "");
    if (cleanPhone) {
      waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(confirmText)}`;
    }
  }

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0b1221] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in zoom-in duration-500 mb-6">
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        
        {waLink && !isValid ? (
          <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-pulse">
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 mb-2 uppercase tracking-wide">
              ⚠️ Un Ultimo Passaggio...
            </h1>
            <p className="text-amber-200/90 text-sm font-medium leading-relaxed">
              Per confermare definitivamente l'appuntamento e salvare il link di cancellazione, <span className="font-bold text-amber-400">devi inviare il messaggio WhatsApp</span> al salone.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              {isValid ? "Pagamento Riuscito!" : "Prenotazione Effettuata"}
            </h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {isValid 
                ? "Abbiamo ricevuto il tuo pagamento online. La prenotazione è confermata e il salone ti aspetta." 
                : "La tua prenotazione è confermata. Pagherai direttamente in salone."}
            </p>
          </>
        )}

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
              {waLink && !isValid && (
                <a 
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-[#25D366] hover:bg-[#1ebd5a] text-white font-extrabold text-lg rounded-2xl transition shadow-[0_0_30px_rgba(37,211,102,0.4)] animate-pulse mb-3"
                >
                  <MessageCircle size={24} />
                  Conferma su WhatsApp
                </a>
              )}
              
              <a 
                href={icsDataUri}
                className="flex items-center justify-center gap-2 w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition shadow-[0_0_20px_rgba(0,180,255,0.15)]"
              >
                <CalendarPlus size={20} />
                Aggiungi al Calendario
              </a>
              <a 
                href={googleCalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#131c31] hover:bg-[#1a2642] border border-[#1e2b4a] text-slate-400 hover:text-slate-300 text-sm font-medium rounded-2xl transition mb-3"
              >
                <CalendarPlus size={16} />
                oppure apri in Google Calendar
              </a>

              <Link 
                href={`/cancel/${appointment.cancelToken}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-transparent border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold rounded-2xl transition"
              >
                Gestisci / Annulla Appuntamento
              </Link>
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

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { CheckCircle2 } from "lucide-react";

export default async function SuccessPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const sessionId = searchParams.session_id as string;
  const appId = searchParams.app_id as string;

  let isValid = false;

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

  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0b1221] border border-emerald-500/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in zoom-in duration-500">
        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={48} className="text-emerald-400" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-white mb-3">
          {isValid ? "Pagamento Riuscito!" : "Errore Pagamento"}
        </h1>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          {isValid 
            ? "Abbiamo ricevuto la tua caparra. La prenotazione è confermata e il salone ti aspetta." 
            : "Non siamo riusciti a confermare il pagamento o il link non è valido."}
        </p>

        <div className="space-y-3">
          <Link 
            href={`/t/${slug}`}
            className="block w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition"
          >
            Torna al Negozio
          </Link>
          
          {isValid && (
            <Link 
              href={`/t/${slug}/admin`}
              className="block w-full py-4 bg-[#131c31] hover:bg-[#1a2642] border border-[#1e2b4a] text-slate-300 font-bold rounded-2xl transition"
            >
              {sessionId?.startsWith("mock_") ? "Torna in Dashboard (Demo)" : "Torna in Dashboard"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

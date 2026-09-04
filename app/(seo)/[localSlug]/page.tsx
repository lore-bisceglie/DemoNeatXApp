import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import JsonLd from "@/components/seo/JsonLd";

export async function generateStaticParams() {
  const cities = ["milano", "roma", "napoli", "torino", "palermo", "genova", "bologna", "firenze", "bari", "catania"];
  return cities.map((citta) => ({
    localSlug: `gestionale-parrucchieri-${citta}`,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ localSlug: string }> }) {
  const { localSlug } = await params;
  if (!localSlug.startsWith("gestionale-parrucchieri-")) return {};
  const city = localSlug.replace("gestionale-parrucchieri-", "");
  const CityName = city.charAt(0).toUpperCase() + city.slice(1);

  return {
    title: `Gestionale per parrucchieri a ${CityName} | NeatX`,
    description: `Agenda online per parrucchieri e saloni a ${CityName}: prenotazioni, disponibilità, caparre e promemoria WhatsApp. Prova NeatX gratis per 14 giorni.`,
  };
}

export default async function LocalLandingPage({ params }: { params: Promise<{ localSlug: string }> }) {
  const { localSlug } = await params;
  
  if (!localSlug.startsWith("gestionale-parrucchieri-")) {
    notFound();
  }

  const city = localSlug.replace("gestionale-parrucchieri-", "");
  const CityName = city.charAt(0).toUpperCase() + city.slice(1);

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-[#00b4ff]/30 overflow-x-hidden relative">
      {/* Schema.org FAQPage — per la citazione da parte delle AI (voice search / AI Overviews) */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: `Come posso gestire le prenotazioni del mio salone a ${CityName}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Con NeatX puoi creare una pagina di prenotazione per il tuo salone a ${CityName}, organizzare le disponibilità in agenda e inviare promemoria WhatsApp ai clienti. La prova dura 14 giorni e non richiede carta di credito.`,
              },
            },
            {
              "@type": "Question",
              name: `Come posso organizzare le prenotazioni del mio salone a ${CityName}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Puoi organizzare le prenotazioni del tuo salone a ${CityName} con l'agenda digitale di NeatX: i clienti prenotano online 24/7, il calendario si aggiorna in tempo reale ed evita doppie prenotazioni. Puoi anche richiedere un acconto online con Stripe per ridurre gli appuntamenti mancati.`,
              },
            },
            {
              "@type": "Question",
              name: `Quanto costa NeatX per un parrucchiere a ${CityName}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `NeatX offre una prova gratuita di 14 giorni senza carta di credito. Dopo la prova, il piano Pro parte da 29€ al mese. Non vengono applicate commissioni sulle prenotazioni.`,
              },
            },
            {
              "@type": "Question",
              name: `NeatX funziona su iPad e smartphone per il mio salone a ${CityName}?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Sì, NeatX è 100% in cloud e funziona su iPad, iPhone, Mac, Android e Windows. Ti basta una connessione internet per gestire il tuo salone ovunque ti trovi.`,
              },
            },
          ],
        }}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00b4ff]/10 blur-[150px] rounded-full pointer-events-none" />
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 relative z-10">
          Agenda online per parrucchieri a <span className="text-[#00b4ff]">{CityName}</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-3xl mx-auto relative z-10">
          Una pagina di prenotazione semplice per i tuoi clienti e un&apos;agenda chiara per te: disponibilità, caparre e promemoria WhatsApp in un unico posto.
        </p>
        <Link href="/registrazione" className="inline-block bg-[#00b4ff] text-[#050814] font-extrabold text-lg px-8 py-4 rounded-2xl hover:bg-cyan-400 hover:scale-105 transition-all shadow-[0_0_30px_-5px_rgba(0,180,255,0.4)] relative z-10">
          Crea la tua agenda gratis
        </Link>
        <div className="mt-8 flex justify-center items-center gap-2 text-sm font-semibold text-slate-400">
          <span className="text-emerald-400">✓</span> 14 giorni gratuiti · nessuna carta richiesta · zero commissioni
        </div>
      </section>

      {/* Perché NeatX */}
      <section className="py-20 bg-[#0b1221] border-y border-[#1a2642]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            Cosa puoi gestire con NeatX
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#131c31] border border-[#1e2b4a] p-8 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4 text-[#00b4ff]">Agenda e prenotazioni</h3>
              <p className="text-slate-400">
                Mostra servizi e orari disponibili. I clienti scelgono in autonomia e l&apos;appuntamento entra subito nella tua agenda.
              </p>
            </div>
            <div className="bg-[#131c31] border border-[#1e2b4a] p-8 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4 text-emerald-400">Caparre e promemoria</h3>
              <p className="text-slate-400">
                Puoi richiedere una caparra online e inviare un promemoria WhatsApp il giorno prima dell&apos;appuntamento.
              </p>
            </div>
            <div className="bg-[#131c31] border border-[#1e2b4a] p-8 rounded-3xl">
              <h3 className="text-xl font-bold text-white mb-4 text-purple-400">Disdette e lista d&apos;attesa</h3>
              <p className="text-slate-400">
                Se un cliente annulla, il posto torna visibile e può essere proposto a chi aspetta un appuntamento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Ottimizzate Voice Search */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            Domande comuni
          </h2>
          <div className="space-y-6">
            <div className="bg-[#0b1221] border border-[#1a2642] p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                NeatX è gratuito?
              </h3>
              <p className="text-slate-400 pl-7">
                Puoi provare NeatX gratis per 14 giorni, senza carta di credito. Dopo la prova scegli se continuare con il piano più adatto alla tua attività.
              </p>
            </div>
            <div className="bg-[#0b1221] border border-[#1a2642] p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Posso usare NeatX da smartphone o iPad?
              </h3>
              <p className="text-slate-400 pl-7">
                Sì. NeatX è un&apos;applicazione web: puoi gestire l&apos;agenda da smartphone, tablet o computer.
              </p>
            </div>
            <div className="bg-[#0b1221] border border-[#1a2642] p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Come funzionano i promemoria?
              </h3>
              <p className="text-slate-400 pl-7">
                Il giorno prima dell&apos;appuntamento, NeatX invia automaticamente un messaggio WhatsApp con i dettagli e il link per annullare o spostare la prenotazione.
              </p>
            </div>
            <div className="bg-[#0b1221] border border-[#1a2642] p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                Posso far prenotare i clienti anche fuori dall&apos;orario del salone?
              </h3>
              <p className="text-slate-400 pl-7">
                Sì. La tua pagina di prenotazione resta disponibile online: il cliente può scegliere un orario libero anche quando il salone è chiuso.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

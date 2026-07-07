"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TerminiCondizioni() {
  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-[#00b4ff]/30 flex flex-col relative overflow-hidden">
      {/* Background glow per coerenza stilistica */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00b4ff]/5 blur-[120px] rounded-full pointer-events-none opacity-50" />

      <Navbar onOpenRoi={() => {}} />

      <main className="flex-grow pt-32 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
            <h1 className="text-4xl font-extrabold text-white mb-8 tracking-tight">Termini e Condizioni d'Uso</h1>
            
            <div className="space-y-8 text-slate-300 leading-relaxed">
              <section>
                <p className="text-sm text-slate-500 mb-6">Ultimo aggiornamento: Luglio 2026</p>
                <p>
                  Benvenuto su NeatX. I presenti Termini e Condizioni regolano l'accesso e l'utilizzo della piattaforma 
                  software as a service (SaaS) "NeatX", destinata a professionisti e titolari di saloni per la gestione 
                  delle prenotazioni online.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Accettazione dei Termini</h2>
                <p>
                  Creando un account, abbonandosi o utilizzando i servizi di NeatX, l'utente (denominato "Cliente" o "Professionista") 
                  accetta integralmente e senza riserve i presenti Termini e Condizioni. Se non si accettano le seguenti condizioni, 
                  è fatto divieto di utilizzare la piattaforma.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Servizi Offerti e Abbonamento</h2>
                <p>
                  NeatX fornisce un'agenda digitale in cloud accessibile via web, comprensiva di sistema di prenotazione clienti, 
                  notifiche SMS/Email e gestione appuntamenti. Il servizio è fornito con la formula dell'abbonamento mensile 
                  o annuale, senza trattenute di commissioni sulle prenotazioni gestite dai clienti finali del Professionista.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Pagamenti e Fatturazione</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>L'abbonamento viene addebitato anticipatamente con cadenza mensile o annuale tramite carta di credito/debito.</li>
                  <li>In caso di mancato pagamento, NeatX si riserva il diritto di sospendere temporaneamente l'accesso al pannello di amministrazione fino alla regolarizzazione.</li>
                  <li>Non sono previsti rimborsi per periodi di utilizzo parziale o per mancato utilizzo della piattaforma.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Responsabilità dei Dati</h2>
                <p>
                  Il Professionista è l'unico responsabile dei dati dei propri clienti inseriti sulla piattaforma. NeatX agisce 
                  esclusivamente come Responsabile del Trattamento (Data Processor) fornendo l'infrastruttura tecnica. 
                  Il Professionista garantisce di aver ottenuto i consensi necessari dai propri clienti finali per il trattamento 
                  dei loro dati personali.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Limitazione di Responsabilità</h2>
                <p>
                  NeatX si impegna a garantire la massima disponibilità (uptime) del servizio. Tuttavia, il servizio viene 
                  fornito "così com'è" e "come disponibile". NeatX non è responsabile per eventuali danni diretti, indiretti o 
                  perdite di profitto derivanti da temporanei disservizi tecnici, bug o interruzioni di rete.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Disdetta dell'Abbonamento</h2>
                <p>
                  Il Professionista può disdire il proprio abbonamento in qualsiasi momento direttamente dal proprio pannello di 
                  controllo. Alla cancellazione, il servizio rimarrà attivo fino al termine del periodo di fatturazione in corso.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Modifiche ai Termini</h2>
                <p>
                  NeatX si riserva il diritto di modificare i presenti Termini in qualsiasi momento. Gli utenti verranno 
                  avvisati di eventuali modifiche sostanziali tramite notifica via email o avviso nel pannello di controllo.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

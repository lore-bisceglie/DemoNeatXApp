import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | NeatX",
  description: "Informativa sul trattamento dei dati personali nelle prenotazioni NeatX.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050814] px-5 py-16 text-slate-300">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-800 bg-[#0b1221] p-7 sm:p-10">
        <h1 className="mb-6 text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="mb-6 text-sm text-slate-400">Ultimo aggiornamento: 18 luglio 2026</p>

        <div className="space-y-7 leading-7">
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Dati trattati</h2>
            <p>
              Per gestire una prenotazione raccogliamo i dati inseriti nel modulo, come nome,
              numero di telefono, servizio, sede, data e orario scelti.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Finalità</h2>
            <p>
              I dati vengono utilizzati per registrare e gestire l’appuntamento, inviare le
              comunicazioni operative richieste e consentire al salone di fornire il servizio.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Titolare e conservazione</h2>
            <p>
              Il salone presso cui prenoti è titolare dei dati relativi all’appuntamento. NeatX
              tratta tali dati come fornitore tecnico e li conserva per il tempo necessario alla
              gestione del servizio e agli obblighi applicabili.
            </p>
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Diritti e contatti</h2>
            <p>
              Puoi chiedere accesso, rettifica o cancellazione dei tuoi dati contattando il salone
              interessato oppure scrivendo a support@neatx.store.
            </p>
          </section>
        </div>

        <Link href="/" className="mt-10 inline-flex font-semibold text-cyan-400 hover:text-cyan-300">
          Torna a NeatX
        </Link>
      </article>
    </main>
  );
}

export default function BrandMeaningSection() {
  return (
    <section className="relative z-10 overflow-hidden border-y border-[#1a2642] bg-[#070b16] py-16 md:py-20">
      <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-[110px]" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#00b4ff]/10 blur-[110px]" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <div className="mb-7 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-300">
            Il nome non è casuale
          </div>

          <div className="text-6xl font-black leading-none tracking-[-0.06em] text-white sm:text-7xl md:text-8xl">
            NEAT<span className="text-[#00b4ff]">X</span>
          </div>
          <p className="mt-5 text-lg font-semibold text-slate-400">Due idee. Un solo criterio.</p>

          <div className="mt-10 space-y-6">
            <div className="border-l-2 border-white/50 pl-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-white">NEAT</div>
              <p className="mt-2 text-lg font-bold text-white">Pulito, ordinato, preciso.</p>
            </div>
            <div className="border-l-2 border-[#00b4ff] pl-5">
              <div className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#00b4ff]">X = NEXT</div>
              <p className="mt-2 text-lg font-bold text-white">Il passo successivo.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0b1221]/90 p-7 shadow-2xl shadow-black/20 sm:p-8">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Se il digitale complica il lavoro,<br />
            <span className="text-[#00b4ff]">
              sta facendo il lavoro sbagliato.
            </span>
          </h2>

          <div className="mt-8 space-y-5 text-base font-medium leading-relaxed text-slate-300 sm:text-lg">
            <p>
              NeatX nasce da questa convinzione. Volevo costruire un prodotto che
              portasse ordine, non altra complessità. Per questo ho scelto due parole precise.
            </p>
            <p>
              <strong className="text-cyan-300">NEAT</strong>{" "}
              è l&apos;ordine che manca quando
              servizi, orari, messaggi e prenotazioni vivono in posti diversi. Significa
              pulito, ordinato, preciso: non per estetica, ma per lavorare con più tranquillità.
            </p>
            <p>
              La <strong className="text-[#00b4ff]">X viene da Next</strong>.{" "}
              È il passo dopo
              telefonate, chat da rincorrere e agende da riscrivere. Non un futuro lontano:
              semplicemente un modo più naturale di farsi prenotare, oggi.
            </p>
          </div>

          <div className="mt-9 border-t border-white/10 pt-7">
            <p className="text-lg font-extrabold leading-relaxed text-white">
              Il digitale non dovrebbe portare altro disordine nella giornata di un professionista.
              NeatX nasce per fare il contrario.
            </p>
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-slate-500">
              L&apos;idea da cui è nato NeatX
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Loader2,
  Globe2,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
  UserRound,
} from "lucide-react";
import { demoCategoryOptions } from "@/lib/demoShopTemplates";

const categoryHints: Record<string, { services: string; staff: string; bookings: string }> = {
  hair_women: {
    services: "Piega, taglio, colore, balayage",
    staff: "3 professionisti demo",
    bookings: "5 appuntamenti gia in agenda",
  },
  barber: {
    services: "Taglio, barba, sfumatura",
    staff: "3 barbieri demo",
    bookings: "5 appuntamenti gia in agenda",
  },
  beauty_center: {
    services: "Viso, corpo, epilazione",
    staff: "3 estetiste demo",
    bookings: "5 appuntamenti gia in agenda",
  },
  nail_salon: {
    services: "Semipermanente, refill, pedicure",
    staff: "2 nail artist demo",
    bookings: "5 appuntamenti gia in agenda",
  },
  massage: {
    services: "Relax, sportivo, decontratturante",
    staff: "2 operatori demo",
    bookings: "5 appuntamenti gia in agenda",
  },
  personal_trainer: {
    services: "Sessioni, valutazioni, check",
    staff: "2 trainer demo",
    bookings: "5 appuntamenti gia in agenda",
  },
  private_studio: {
    services: "Consulenze, follow-up, sessioni",
    staff: "2 professionisti demo",
    bookings: "5 appuntamenti gia in agenda",
  },
};

export default function Onboarding() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("barber");
  const [city, setCity] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    slug: string;
    publicUrl: string;
    adminUrl: string;
  } | null>(null);

  const selectedCategory = useMemo(
    () => demoCategoryOptions.find((item) => item.value === category) || demoCategoryOptions[0],
    [category]
  );
  const hint = categoryHints[category] || categoryHints.barber;

  const handleCreate = async () => {
    setError("");

    if (!businessName.trim() || !category || !city.trim() || !ownerName.trim() || !password.trim() || !phone.trim() || !email.trim()) {
      setError("Compila nome attivita, categoria, citta, email, nome, password e WhatsApp prenotazioni.");
      return;
    }

    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          email,
          category,
          city,
          ownerName,
          password,
          phone,
          address,
          instagramUrl,
          tiktokUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore durante la creazione.");

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || "Errore durante la creazione.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <main className="min-h-screen bg-[#050814] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10">
            <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
          </div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Creazione negozio</p>
          <h1 className="text-3xl font-extrabold sm:text-5xl">Sto preparando la tua pagina online.</h1>
          <p className="mt-4 text-sm font-medium leading-relaxed text-slate-400">
            Genero servizi, prezzi, staff, orari, disponibilita e prenotazioni demo coerenti con {selectedCategory.label}.
          </p>
        </div>
      </main>
    );
  }

  if (successData) {
    return (
      <main className="min-h-screen bg-[#050814] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-300" />
          </div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-emerald-300">Account creato</p>
          <h1 className="text-3xl font-extrabold sm:text-5xl">{businessName} e online.</h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-400">
            La tua registrazione e completata: pagina pubblica, servizi, staff, agenda e prenotazioni demo sono gia configurati.
          </p>

          <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={successData.adminUrl}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-sm font-extrabold text-[#03111f] transition hover:bg-cyan-300"
            >
              Entra nella dashboard
              <ArrowRight size={18} />
            </Link>
            <Link
              href={successData.publicUrl}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1e2b4a] bg-[#0b1221] px-5 py-4 text-sm font-extrabold text-white transition hover:border-cyan-500/40"
            >
              Vedi pagina cliente
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050814] px-5 py-6 text-slate-200">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          <span className="text-white">Neat</span>
          <span className="text-[#00b4ff]">X</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full border border-[#1e2b4a] px-4 py-2 text-xs font-extrabold text-slate-300">
            Accedi
          </Link>
          <Link href="/demo" className="rounded-full border border-[#1e2b4a] px-4 py-2 text-xs font-extrabold text-slate-300">
            Esplora demo
          </Link>
        </div>
      </div>

      <section className="mx-auto grid min-h-[calc(100vh-90px)] w-full max-w-6xl grid-cols-1 items-center gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-cyan-300">
            <Sparkles size={15} />
            Registrazione + prova 7 giorni
          </div>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Registrati e crea il tuo negozio online in 60 secondi.
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-slate-400 sm:text-lg">
            Inserisci pochi dati. NeatX crea il tuo account e genera subito una pagina prenotabile con servizi, staff, orari e appuntamenti demo.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              "Pagina pubblica pronta",
              "Agenda con prenotazioni demo",
              "Dati modificabili dopo",
            ].map((point) => (
              <div key={point} className="rounded-2xl border border-[#1a2642] bg-[#0b1221] p-4">
                <BadgeCheck className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-sm font-extrabold text-white">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[#1a2642] bg-[#0b1221] p-5 shadow-2xl shadow-cyan-950/20 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Dati essenziali</p>
            <h2 className="mt-1 text-2xl font-extrabold text-white">Crea il tuo account</h2>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <Building2 size={14} />
                Nome attivita
              </span>
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="Es. Barber Lab Milano"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <Scissors size={14} />
                Categoria
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              >
                {demoCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <MapPin size={14} />
                  Citta
                </span>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Milano"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <UserRound size={14} />
                  Proprietario
                </span>
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Lorenzo"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Phone size={14} />
                  WhatsApp prenotazioni
                </span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Es. 3331234567"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Globe2 size={14} />
                  Email Proprietario
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Es. mario@email.com"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <MapPin size={14} />
                Indirizzo completo
              </span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="Via Roma 10, Milano"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Globe2 size={14} />
                  Instagram
                </span>
                <input
                  value={instagramUrl}
                  onChange={(event) => setInstagramUrl(event.target.value)}
                  className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Es. @neatx_agenda"
                />
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Globe2 size={14} />
                  TikTok
                </span>
                <input
                  value={tiktokUrl}
                  onChange={(event) => setTiktokUrl(event.target.value)}
                  className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Es. @neatx_agenda"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <UserRound size={14} />
                Password dashboard
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#1e2b4a] bg-[#050814] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                placeholder="Almeno 8 caratteri"
              />
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Anteprima automatica</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#050814] p-3">
                <p className="text-xs text-slate-500">Servizi</p>
                <p className="mt-1 text-sm font-extrabold text-white">{hint.services}</p>
              </div>
              <div className="rounded-xl bg-[#050814] p-3">
                <p className="text-xs text-slate-500">Staff</p>
                <p className="mt-1 text-sm font-extrabold text-white">{hint.staff}</p>
              </div>
              <div className="rounded-xl bg-[#050814] p-3">
                <p className="text-xs text-slate-500">Agenda</p>
                <p className="mt-1 text-sm font-extrabold text-white">{hint.bookings}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreate}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-extrabold text-[#03111f] shadow-xl shadow-cyan-950/40 transition hover:bg-cyan-300"
          >
            Crea la mia pagina prenotazioni
            <ArrowRight size={19} />
          </button>

          <p className="mt-4 text-center text-xs font-medium text-slate-500">
            Nessuna carta richiesta. Il negozio demo diventa reale quando lo pubblichi.
          </p>
        </div>
      </section>
    </main>
  );
}

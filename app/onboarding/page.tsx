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
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { demoCategoryOptions, sanitizeSlug } from "@/lib/demoShopTemplates";
import { isReservedSubdomain } from "@/lib/domains";
import { validateInstagramProfile } from "@/lib/contact";

const categoryHints: Record<string, { services: string; staff: string; bookings: string }> = {
  hair_women: {
    services: "Piega, taglio, colore, balayage",
    staff: "3 professionisti demo",
    bookings: "5 appuntamenti già in agenda",
  },
  barber: {
    services: "Taglio, barba, sfumatura",
    staff: "3 barbieri demo",
    bookings: "5 appuntamenti già in agenda",
  },
  beauty_center: {
    services: "Viso, corpo, epilazione",
    staff: "3 estetiste demo",
    bookings: "5 appuntamenti già in agenda",
  },
  nail_salon: {
    services: "Semipermanente, refill, pedicure",
    staff: "2 nail artist demo",
    bookings: "5 appuntamenti già in agenda",
  },
  massage: {
    services: "Relax, sportivo, decontratturante",
    staff: "2 operatori demo",
    bookings: "5 appuntamenti già in agenda",
  },
  personal_trainer: {
    services: "Sessioni, valutazioni, check",
    staff: "2 trainer demo",
    bookings: "5 appuntamenti già in agenda",
  },
  private_studio: {
    services: "Consulenze, follow-up, sessioni",
    staff: "2 professionisti demo",
    bookings: "5 appuntamenti già in agenda",
  },
  medico: {
    services: "Visite, controlli, check-up",
    staff: "0 staff demo (solo titolare)",
    bookings: "0 appuntamenti demo",
  },
  nutrizionista: {
    services: "Prime visite, controlli, diete",
    staff: "0 staff demo (solo titolare)",
    bookings: "0 appuntamenti demo",
  },
  tatuatore: {
    services: "Consulenze, tattoo piccoli e grandi",
    staff: "0 staff demo (solo titolare)",
    bookings: "0 appuntamenti demo",
  },
  toelettatura: {
    services: "Bagni e tagli, taglia piccola e media",
    staff: "0 staff demo (solo titolare)",
    bookings: "0 appuntamenti demo",
  },
  psicologo: {
    services: "Colloqui individuali, di coppia",
    staff: "0 staff demo (solo titolare)",
    bookings: "0 appuntamenti demo",
  },
  consulente: {
    services: "Call, meeting strategici",
    staff: "0 staff demo (solo titolare)",
    bookings: "0 appuntamenti demo",
  },
};

const THEME_COLORS = [
  { value: "cyan", label: "Cyan", dot: "bg-cyan-400" },
  { value: "rose", label: "Rosa", dot: "bg-rose-400" },
  { value: "emerald", label: "Smeraldo", dot: "bg-emerald-400" },
  { value: "amber", label: "Ambra", dot: "bg-amber-400" },
  { value: "purple", label: "Viola", dot: "bg-purple-400" },
  { value: "slate", label: "Grigio", dot: "bg-slate-400" },
  { value: "red", label: "Rosso", dot: "bg-red-400" },
  { value: "indigo", label: "Indaco", dot: "bg-indigo-400" },
  { value: "teal", label: "Verde Acqua", dot: "bg-teal-400" },
  { value: "fuchsia", label: "Fucsia", dot: "bg-fuchsia-400" },
];

export default function Onboarding() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("barber");
  const [city, setCity] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeColor, setThemeColor] = useState("cyan");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [existingAccountSlug, setExistingAccountSlug] = useState("");
  const [successData, setSuccessData] = useState<{
    slug: string;
    publicUrl: string;
    adminUrl: string;
    needsVerification?: boolean;
  } | null>(null);

  const selectedCategory = useMemo(
    () => demoCategoryOptions.find((item) => item.value === category) || demoCategoryOptions[0],
    [category]
  );
  const hint = categoryHints[category] || categoryHints.barber;
  const instagramProfile = useMemo(() => validateInstagramProfile(instagramUrl), [instagramUrl]);

  const previewSlug = useMemo(() => {
    if (!businessName.trim()) return "";
    let raw = sanitizeSlug(businessName);
    if (!raw || isReservedSubdomain(raw)) {
      raw = raw ? `${raw}-store` : "negozio";
    }
    if (isReservedSubdomain(raw)) {
      raw = "negozio";
    }
    return raw;
  }, [businessName]);

  const isOnlySpecialChars = useMemo(() => {
    if (!businessName.trim()) return false;
    return !/[a-zA-Z0-9]/.test(businessName);
  }, [businessName]);

  const isReservedName = useMemo(() => {
    if (!businessName.trim()) return false;
    return isReservedSubdomain(sanitizeSlug(businessName));
  }, [businessName]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX) { height *= MAX / width; width = MAX; }
        } else {
          if (height > MAX) { width *= MAX / height; height = MAX; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        setLogoUrl(canvas.toDataURL("image/webp", 0.8));
      };
      if (typeof e.target?.result === "string") img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (isGenerating) return;
    setError("");
    setExistingAccountSlug("");
    setAttemptedSubmit(true);

    if (!businessName.trim() || !category || !city.trim() || !ownerName.trim() || !password || !confirmPassword || !phone.trim() || !email.trim()) {
      setError("Compila tutti i campi obbligatori evidenziati in rosso.");
      return;
    }

    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }

    if (!instagramProfile.valid) {
      setError("Instagram non valido. Incolla il link del tuo profilo, non il link di un post o Reel.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Le due password non coincidono.");
      return;
    }
    if (!legalAccepted) {
      setError("Accetta Privacy Policy e Termini di servizio per continuare.");
      return;
    }

    setIsGenerating(true);

    const referredByCode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") : null;

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
          confirmPassword,
          phone,
          address,
          instagramUrl,
          tiktokUrl,
          logoUrl,
          themeColor,
          legalAccepted,
          ref: referredByCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "EMAIL_ALREADY_REGISTERED" && typeof data.slug === "string") {
          setExistingAccountSlug(data.slug);
        }
        throw new Error(data.error || "Errore durante la creazione.");
      }

      setSuccessData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Errore durante la creazione.");
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
            Genero servizi, prezzi, staff, orari, disponibilità e prenotazioni demo coerenti con {selectedCategory.label}.
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
          <h1 className="text-3xl font-extrabold sm:text-5xl">{businessName} è online.</h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-400">
            La tua registrazione è completata: pagina pubblica, servizi, staff, agenda e prenotazioni demo sono già configurati.
          </p>

          {successData.needsVerification && (
            <div className="mt-4 w-full rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-left">
              <p className="text-sm font-bold text-amber-300">Verifica la tua email</p>
              <p className="mt-1 text-xs text-slate-400">
                Ti abbiamo inviato un link di conferma a <strong className="text-slate-300">{email}</strong>. 
                Cliccalo per attivare l'accesso alla dashboard. Se non lo trovi, controlla la cartella spam.
              </p>
            </div>
          )}

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
            Registrazione + prova 14 giorni
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
                Nome attività
              </span>
              <input
                maxLength={50}
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 text-white outline-none transition ${
                  attemptedSubmit && !businessName.trim() ? "border-red-500" : "border-[#1e2b4a] focus:border-cyan-400"
                }`}
                placeholder="Es. Barber Lab Milano"
              />
              {attemptedSubmit && !businessName.trim() && (
                <p className="mt-1 text-xs font-bold text-red-400">Questo campo è richiesto.</p>
              )}
              {businessName.trim() && (
                <div className="mt-1.5 text-xs font-medium">
                  {isOnlySpecialChars ? (
                    <p className="text-amber-400">
                      ⚠️ Il nome contiene solo caratteri speciali. Verrà generato lo slug:{" "}
                      <span className="font-bold text-amber-300">{previewSlug}.neatx.store</span>
                    </p>
                  ) : isReservedName ? (
                    <p className="text-amber-400">
                      ⚠️ Sottodominio riservato. Verrà generato lo slug alternativo:{" "}
                      <span className="font-bold text-amber-300">{previewSlug}.neatx.store</span>
                    </p>
                  ) : (
                    <p className="text-slate-400">
                      Anteprima link:{" "}
                      <span className="font-bold text-cyan-300">{previewSlug}.neatx.store</span>
                    </p>
                  )}
                </div>
              )}
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
                  Città
                </span>
                <input
                  maxLength={50}
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 text-white outline-none transition ${
                    attemptedSubmit && !city.trim() ? "border-red-500" : "border-[#1e2b4a] focus:border-cyan-400"
                  }`}
                  placeholder="Milano"
                />
                {attemptedSubmit && !city.trim() && (
                  <p className="mt-1 text-xs font-bold text-red-400">Questo campo è richiesto.</p>
                )}
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <UserRound size={14} />
                  Proprietario
                </span>
                <input
                  maxLength={50}
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 text-white outline-none transition ${
                    attemptedSubmit && !ownerName.trim() ? "border-red-500" : "border-[#1e2b4a] focus:border-cyan-400"
                  }`}
                  placeholder="Lorenzo"
                />
                {attemptedSubmit && !ownerName.trim() && (
                  <p className="mt-1 text-xs font-bold text-red-400">Questo campo è richiesto.</p>
                )}
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                  <Phone size={14} />
                  WhatsApp prenotazioni
                </span>
                <input
                  maxLength={50}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 text-white outline-none transition ${
                    attemptedSubmit && !phone.trim() ? "border-red-500" : "border-[#1e2b4a] focus:border-cyan-400"
                  }`}
                  placeholder="Es. 3331234567"
                />
                {attemptedSubmit && !phone.trim() && (
                  <p className="mt-1 text-xs font-bold text-red-400">Questo campo è richiesto.</p>
                )}
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
                  className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 text-white outline-none transition ${
                    attemptedSubmit && !email.trim() ? "border-red-500" : "border-[#1e2b4a] focus:border-cyan-400"
                  }`}
                  placeholder="Es. mario@email.com"
                />
                {attemptedSubmit && !email.trim() && (
                  <p className="mt-1 text-xs font-bold text-red-400">Questo campo è richiesto.</p>
                )}
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
                  className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 text-white outline-none transition ${
                    attemptedSubmit && !instagramProfile.valid ? "border-red-500" : "border-[#1e2b4a] focus:border-cyan-400"
                  }`}
                  placeholder="https://www.instagram.com/nomeprofilo/"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  Apri il tuo profilo Instagram, scegli <strong>Condividi profilo → Copia link</strong> e incollalo qui. Va bene anche @nomeutente. Non inserire il link di un post o Reel.
                </p>
                {attemptedSubmit && !instagramProfile.valid && (
                  <p className="mt-1 text-xs font-bold text-red-400">Inserisci il link del profilo Instagram corretto.</p>
                )}
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
            <div>
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <ImageIcon size={14} />
                Logo / Foto negozio
              </span>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#1e2b4a] bg-[#050814]">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-600">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>
                <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-[#1e2b4a] bg-[#050814] px-4 py-3 text-sm text-slate-400 transition hover:border-cyan-400">
                  Carica dal PC
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div>
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <Sparkles size={14} />
                Colore tema
              </span>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color.value}
                    onClick={() => setThemeColor(color.value)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                      themeColor === color.value
                        ? "border-cyan-400 bg-cyan-400/10 text-white"
                        : "border-[#1e2b4a] text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${color.dot}`} />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <UserRound size={14} />
                Password dashboard
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 pr-12 text-white outline-none transition ${
                    attemptedSubmit && password.length < 8 ? "border-red-500" : "border-[#1e2b4a] focus:border-cyan-400"
                  }`}
                  placeholder="Almeno 8 caratteri"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-cyan-300"
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {attemptedSubmit && password.length < 8 && (
                <p className="mt-1 text-xs font-bold text-red-400">
                  {password.length === 0 ? "Questo campo è richiesto." : "La password deve avere almeno 8 caratteri."}
                </p>
              )}
            </div>

            <div>
              <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                <UserRound size={14} />
                Conferma password
              </span>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`w-full rounded-2xl border bg-[#050814] px-4 py-3 pr-12 text-white outline-none transition ${
                    attemptedSubmit && (!confirmPassword || password !== confirmPassword)
                      ? "border-red-500"
                      : "border-[#1e2b4a] focus:border-cyan-400"
                  }`}
                  placeholder="Ripeti la password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-cyan-300"
                  aria-label={showConfirmPassword ? "Nascondi password" : "Mostra password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {attemptedSubmit && (!confirmPassword || password !== confirmPassword) && (
                <p className="mt-1 text-xs font-bold text-red-400">
                  {!confirmPassword ? "Questo campo è richiesto." : "Le due password non coincidono."}
                </p>
              )}
            </div>
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
              <p>{error}</p>
              {existingAccountSlug && (
                <Link
                  href={`/t/${existingAccountSlug}/admin`}
                  className="mt-2 inline-block text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                >
                  Vai all'accesso del tuo account
                </Link>
              )}
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#1e2b4a] bg-[#050814] p-4">
            <input
              id="onboarding-legal"
              type="checkbox"
              checked={legalAccepted}
              onChange={(event) => setLegalAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-cyan-500"
            />
            <label htmlFor="onboarding-legal" className="text-xs leading-relaxed text-slate-400">
              Ho letto e accetto la{" "}
              <Link href="/privacy" className="text-cyan-300 underline">
                Privacy Policy
              </Link>{" "}
              e i{" "}
              <Link href="/termini" className="text-cyan-300 underline">
                Termini di servizio
              </Link>
              .
            </label>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!legalAccepted}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-4 text-base font-extrabold text-[#03111f] shadow-xl shadow-cyan-950/40 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
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

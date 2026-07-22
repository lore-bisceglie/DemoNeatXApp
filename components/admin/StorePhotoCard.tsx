"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { CheckCircle2, ImageIcon, Loader2, Upload } from "lucide-react";

interface StorePhotoCardProps {
  tenantSlug: string;
  tenantName: string;
  initialLogoUrl: string | null;
}

interface TenantPatchResponse {
  error?: string;
  tenant?: {
    logoUrl?: string | null;
  };
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SOURCE_FILE_BYTES = 8 * 1024 * 1024;

function isDisplayableLogo(value: string): boolean {
  return /^(https?:\/\/|data:image\/(?:png|jpe?g|webp);base64,)/i.test(value.trim());
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Non riesco a leggere questa immagine."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Non riesco a leggere questa immagine."));
        return;
      }

      const source = new window.Image();
      source.onerror = () => reject(new Error("Il file selezionato non è un'immagine valida."));
      source.onload = () => {
        const maxSide = 500;
        const scale = Math.min(1, maxSide / Math.max(source.naturalWidth, source.naturalHeight));
        const width = Math.max(1, Math.round(source.naturalWidth * scale));
        const height = Math.max(1, Math.round(source.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Il browser non riesce a elaborare questa immagine."));
          return;
        }

        context.drawImage(source, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function StorePhotoCard({ tenantSlug, tenantName, initialLogoUrl }: StorePhotoCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalLogoUrl = initialLogoUrl?.trim() || "";
  const initialDisplayableLogo = isDisplayableLogo(originalLogoUrl) ? originalLogoUrl : "";
  const hasInvalidLegacyLogo = Boolean(originalLogoUrl && !initialDisplayableLogo);
  const [savedLogoUrl, setSavedLogoUrl] = useState(originalLogoUrl);
  const [draftLogoUrl, setDraftLogoUrl] = useState(initialDisplayableLogo);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges = draftLogoUrl.trim() !== savedLogoUrl;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    setSuccess("");
    setPreviewFailed(false);

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Scegli una foto PNG, JPG o WebP.");
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setError("La foto supera 8 MB. Scegline una più leggera.");
      return;
    }

    setProcessing(true);
    try {
      setDraftLogoUrl(await fileToDataUrl(file));
    } catch (uploadError: unknown) {
      setError(uploadError instanceof Error ? uploadError.message : "Non riesco a elaborare questa immagine.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSave() {
    if (!draftLogoUrl.trim()) {
      setError("Carica una foto oppure inserisci il suo indirizzo.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/tenant/${encodeURIComponent(tenantSlug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: draftLogoUrl }),
      });
      const data = (await response.json()) as TenantPatchResponse;
      if (!response.ok) {
        throw new Error(data.error || "Salvataggio non riuscito.");
      }

      const nextLogoUrl = data.tenant?.logoUrl || draftLogoUrl.trim();
      setDraftLogoUrl(nextLogoUrl);
      setSavedLogoUrl(nextLogoUrl);
      setSuccess("Foto aggiornata. Ora è visibile nella pagina di prenotazione.");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Salvataggio non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#1a2642] bg-[#0b1221] p-4 sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-[#243451] bg-[#050814]">
          {draftLogoUrl && !previewFailed ? (
            <Image
              key={draftLogoUrl}
              src={draftLogoUrl}
              alt={`Foto di ${tenantName}`}
              fill
              unoptimized
              sizes="112px"
              className="object-cover"
              onError={() => {
                setPreviewFailed(true);
                setError("Non riesco ad aprire questo indirizzo. Usa un link diretto all'immagine oppure carica il file dal dispositivo.");
              }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-slate-500">
              <ImageIcon size={24} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {previewFailed ? "Anteprima non disponibile" : "Nessuna foto"}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">Immagine pubblica</p>
          <h3 className="mt-1 text-lg font-bold text-white">Foto del negozio</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
            Compare nella pagina di prenotazione e viene usata per tutte le sedi dell’attività.
          </p>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing || saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-[#04101e] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
              {processing ? "Preparo la foto..." : "Carica foto"}
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={draftLogoUrl.startsWith("data:") ? "" : draftLogoUrl}
                onChange={(event) => {
                  setDraftLogoUrl(event.target.value);
                  setPreviewFailed(false);
                  setError("");
                  setSuccess("");
                }}
                placeholder="Oppure incolla https://..."
                aria-label="Indirizzo della foto del negozio"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#1e2b4a] bg-[#050814] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || processing || !draftLogoUrl.trim() || !hasChanges || previewFailed}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Salvataggio..." : "Salva foto"}
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">PNG, JPG o WebP, massimo 8 MB. La foto viene ottimizzata automaticamente.</p>
          {hasInvalidLegacyLogo && !savedLogoUrl.startsWith("data:") && savedLogoUrl === originalLogoUrl && (
            <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300">
              La foto precedente puntava a un file del computer e non poteva apparire online. Caricala di nuovo da qui.
            </p>
          )}
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-400">{error}</p>}
          {success && (
            <p role="status" className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle2 size={16} /> {success}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

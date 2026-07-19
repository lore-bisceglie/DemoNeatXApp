import React from "react";
import Link from "next/link";
import WaitlistButton from "@/app/WaitlistButton";
import { Service, TenantInfoType, ThemeConfig } from "./types";

interface BookingFormProps {
  date: string;
  setDate: (date: string) => void;
  today: string;
  maxDate: string;
  dateError: string;
  isHoliday: boolean;
  loading: boolean;
  slots: string[];
  selectedSlot: string;
  setSelectedSlot: (slot: string) => void;
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  honey: string;
  setHoney: (honey: string) => void;
  privacyAccepted: boolean;
  setPrivacyAccepted: (accepted: boolean) => void;
  paymentMethod: "salon" | "online";
  setPaymentMethod: (method: "salon" | "online") => void;
  formError: string;
  setFormError: (error: string) => void;
  fieldErrors: string[];
  setFieldErrors: (errors: string[]) => void;
  isBooking: boolean;
  isButtonDisabled: boolean;
  isSelectedLastMinute: boolean;
  isScarce: boolean;
  tenantInfo: TenantInfoType;
  selectedService: Service | null;
  canUseOnlinePayment: boolean;
  isPlaygroundDemo: boolean;
  th: ThemeConfig;
  noSlotsMessage: { icon: string; badge: string; badgeClass: string; title: string; text: string };
  demandMode: { title: string; message: string } | null;
  demandClass: string;
  demandAccent: string;
  handleFirstAvailable: () => void;
  fillDemoCustomer: () => void;
  handleBook: () => void;
}

export function BookingForm({
  date,
  setDate,
  today,
  maxDate,
  dateError,
  isHoliday,
  loading,
  slots,
  selectedSlot,
  setSelectedSlot,
  name,
  setName,
  phone,
  setPhone,
  honey,
  setHoney,
  privacyAccepted,
  setPrivacyAccepted,
  paymentMethod,
  setPaymentMethod,
  formError,
  setFormError,
  fieldErrors,
  setFieldErrors,
  isBooking,
  isButtonDisabled,
  isSelectedLastMinute,
  isScarce,
  tenantInfo,
  selectedService,
  canUseOnlinePayment,
  isPlaygroundDemo,
  th,
  noSlotsMessage,
  demandMode,
  demandClass,
  demandAccent,
  handleFirstAvailable,
  fillDemoCustomer,
  handleBook,
}: BookingFormProps) {
  const canPayOnline = Boolean(
    canUseOnlinePayment && (
      tenantInfo.storeSettings?.stripeOnboardingComplete ||
      tenantInfo.storeSettings?.stripeConnected ||
      isPlaygroundDemo
    )
  );

  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2 text-slate-300">
          Scegli il giorno
        </label>
        <input
          type="date"
          value={date}
          min={today}
          max={maxDate}
          onChange={(e) => {
            setDate(e.target.value);
            setFormError("");
          }}
          className={`w-full bg-[#131c31] border ${
            dateError ? "border-red-500" : "border-[#1e2b4a]"
          } text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition`}
          style={{ colorScheme: "dark" }}
        />
        {dateError && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
            <span>[!]</span> {dateError}
          </div>
        )}
      </div>

      {isHoliday ? (
        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-6 rounded-2xl text-center shadow-inner animate-in fade-in zoom-in duration-150">
          <span className="text-4xl mb-2 block">🏖️</span>
          <h3 className="font-extrabold text-lg mb-1 text-white">Siamo in Ferie!</h3>
          <p className="text-sm font-medium">
            L'attività è chiusa in questa data. Per favore, seleziona un altro giorno dal calendario.
          </p>
        </div>
      ) : dateError !== "" ? null : loading ? (
        <div className="py-6">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="h-10 bg-[#1a2642] rounded-xl animate-pulse"></div>
            <div className="h-10 bg-[#1a2642] rounded-xl animate-pulse"></div>
            <div className="h-10 bg-[#1a2642] rounded-xl animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="h-10 bg-[#1a2642] rounded-xl animate-pulse"></div>
            <div className="h-10 bg-[#1a2642] rounded-xl animate-pulse"></div>
          </div>
          <p className="text-slate-500 text-xs text-center font-medium animate-pulse mt-4">
            Calcolo incastri perfetti in corso...
          </p>
        </div>
      ) : slots.length === 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-8">
          <div className="mb-4 text-center">
            <span className="text-4xl mb-3 block">{noSlotsMessage.icon}</span>
            <span
              className={`inline-block ${noSlotsMessage.badgeClass} px-3 py-1 rounded-full text-xs font-bold mb-3 tracking-widest`}
            >
              {noSlotsMessage.badge}
            </span>
            <h3 className="font-extrabold text-lg mb-1 text-white">
              {noSlotsMessage.title}
            </h3>
            <p className="text-slate-300 text-sm font-medium">
              {noSlotsMessage.text}
            </p>
          </div>
          <WaitlistButton selectedDate={date} selectedService={selectedService} tenantId={tenantInfo.id} />
        </div>
      ) : (
        <div className="animate-in fade-in duration-150">
          {demandMode && (
            <div
              className={`mb-5 bg-gradient-to-r ${demandClass} border rounded-xl p-4 animate-in zoom-in duration-300`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span
                    className={`${demandAccent} text-[11px] font-black tracking-widest uppercase text-center sm:text-left`}
                  >
                    {demandMode.title}
                  </span>
                </div>
                <span className="text-orange-100 text-xs font-medium text-center sm:text-right">
                  {slots.length === 1
                    ? "1 incastro rimasto"
                    : `${slots.length} incastri rimasti`}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mt-2 text-center sm:text-left">
                {demandMode.message}
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold mb-2 text-slate-300">
              Orari disponibili
            </label>
            <div className="space-y-2">
              <select
                value={selectedSlot}
                onChange={(e) => {
                  setSelectedSlot(e.target.value);
                  setFormError("");
                  setFieldErrors([]);
                }}
                className={`w-full bg-[#131c31] border ${
                  fieldErrors.includes("orario") ? "border-red-500" : "border-[#1e2b4a]"
                } text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition appearance-none cursor-pointer`}
              >
                <option value="">-- Seleziona un orario --</option>
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} {isScarce ? "🔥 (In esaurimento)" : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={handleFirstAvailable}
                className={`w-full text-xs font-bold py-2 rounded-xl border transition-all duration-150 active:scale-95 ${
                  slots.length > 0
                    ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 shadow-[0_0_10px_rgba(0,180,255,0.12)]"
                    : "bg-[#131c31] text-slate-600 border-[#1e2b4a] cursor-not-allowed"
                }`}
              >
                [+] Primo disponibile
              </button>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <input
              type="text"
              placeholder="Il tuo nome"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError("");
                setFieldErrors([]);
              }}
              className={`w-full bg-[#131c31] border ${
                fieldErrors.includes("nome") ? "border-red-500" : "border-[#1e2b4a]"
              } text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition`}
            />

            <input
              type="tel"
              placeholder="Il tuo numero (WhatsApp)"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setFormError("");
                setFieldErrors([]);
              }}
              className={`w-full bg-[#131c31] border ${
                fieldErrors.includes("telefono") ? "border-red-500" : "border-[#1e2b4a]"
              } text-white rounded-xl px-4 py-3 placeholder-slate-500 focus:outline-none focus:border-[#00b4ff] focus:ring-1 focus:ring-[#00b4ff] transition`}
            />

            {isPlaygroundDemo && (
              <button
                type="button"
                onClick={fillDemoCustomer}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl px-4 py-3 text-xs font-extrabold transition"
              >
                Riempimento demo casuale
              </button>
            )}

            <input
              type="text"
              value={honey}
              onChange={(e) => setHoney(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="flex items-center gap-3 py-2 animate-in fade-in duration-150">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAccepted}
                onChange={(e) => {
                  setPrivacyAccepted(e.target.checked);
                  setFormError("");
                }}
                className="w-5 h-5 rounded border-[#1e2b4a] bg-[#131c31] text-[#00b4ff] focus:ring-[#00b4ff] focus:ring-offset-[#0b1221]"
              />
              <label htmlFor="privacy" className="text-xs text-slate-400 leading-tight">
                Ho letto e accetto la <Link href="/privacy" className={`underline ${th.textMain} ${th.textHover}`}>Privacy Policy</Link> per la gestione dell'appuntamento.
              </label>
            </div>
          </div>

          {(canUseOnlinePayment && (isPlaygroundDemo || (!tenantInfo.storeSettings?.paymentMandatory && tenantInfo.storeSettings?.paymentStrategy !== "OFF" && tenantInfo.storeSettings?.paymentStrategy !== null))) && (
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3 text-slate-300 text-center">
                Come preferisci pagare?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("salon")}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === "salon"
                      ? `bg-[#00b4ff]/10 border-[#00b4ff] ${th.textMain} shadow-[0_0_15px_rgba(0,180,255,0.15)]`
                      : "bg-[#131c31] border-[#1e2b4a] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span className="text-xs font-bold">In salone</span>
                  <span className="text-[9px] opacity-70">Paghi dopo il servizio</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (canPayOnline) {
                      setPaymentMethod("online");
                    }
                  }}
                  className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                    !canPayOnline
                      ? "bg-[#131c31] border-[#1e2b4a] text-slate-600 cursor-not-allowed"
                      : paymentMethod === "online"
                      ? "bg-[#00b4ff]/10 border-[#00b4ff] text-[#00b4ff] shadow-[0_0_15px_rgba(0,180,255,0.15)]"
                      : "bg-[#131c31] border-[#1e2b4a] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <span className="text-xs font-bold">Acconto online</span>
                  <span className="text-[9px] opacity-70">
                    {!canPayOnline
                      ? "Da attivare"
                      : isPlaygroundDemo
                      ? "Simulazione"
                      : "Paga ora su Stripe"}
                  </span>
                </button>
              </div>

              {isPlaygroundDemo && paymentMethod === "online" && (
                <div className="mt-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-left">
                  <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">
                    Pagamento online simulato
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Nella demo non viene aperto Stripe e non ci sono addebiti:
                    l'appuntamento viene salvato come già pagato per mostrare
                    la dashboard.
                  </p>
                </div>
              )}
            </div>
          )}

          {formError && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <p className="text-sm font-medium">{formError}</p>
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={isButtonDisabled}
            className={`w-full font-bold py-3 rounded-xl transition-all duration-150 shadow-lg active:scale-[0.97] ${
              isButtonDisabled
                ? "bg-[#131c31] text-slate-500 cursor-not-allowed shadow-none border border-[#1e2b4a]"
                : isSelectedLastMinute
                ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white shadow-red-500/30 hover:shadow-red-500/40 hover:scale-[1.02]"
                : `${th.btnBg} shadow-cyan-500/20`
            }`}
          >
            {isBooking
              ? "⏳ Elaborazione..."
              : isPlaygroundDemo && paymentMethod === "online"
              ? "Prenota e simula pagamento"
              : (!isPlaygroundDemo && tenantInfo.storeSettings?.paymentStrategy !== "OFF" && (tenantInfo.storeSettings?.paymentMandatory || paymentMethod === "online") && canPayOnline)
              ? "💳 Procedi al pagamento"
              : isSelectedLastMinute
              ? "🔥 Prenota Subito!"
              : "✓ Prenota Ora"}
          </button>

          <p className="text-[10px] text-slate-500 mt-5 text-center mb-8">
            {isPlaygroundDemo
              ? "In demo non apriamo WhatsApp: lo slot viene salvato nel calendario demo."
              : (!isPlaygroundDemo && tenantInfo.storeSettings?.paymentStrategy !== "OFF" && (tenantInfo.storeSettings?.paymentMandatory || paymentMethod === "online") && canPayOnline)
              ? "Verrai reindirizzato al modulo sicuro di Stripe per il pagamento."
              : "Verrai reindirizzato a WhatsApp per confermare."}
          </p>

          <div className="pt-6 border-t border-[#1e2b4a]">
            <WaitlistButton selectedDate={date} selectedService={selectedService} tenantId={tenantInfo.id} />
          </div>
        </div>
      )}
    </>
  );
}

"use client";

function whatsappPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("3")) digits = `39${digits}`;
  return digits.length >= 8 ? digits : "";
}

function openWhatsapp(phone: string, message: string) {
  const digits = whatsappPhone(phone);
  if (!digits) {
    alert("Numero WhatsApp cliente non valido.");
    return;
  }

  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

export default function ReminderButton({
  name,
  date,
  time,
  phone,
  serviceName,
  cancelToken,
}: {
  name: string;
  date: string;
  time: string;
  phone: string;
  serviceName?: string;
  cancelToken?: string;
}) {
  const handleReminder = () => {
    const cancelUrl = cancelToken ? `${window.location.origin}/cancel/${cancelToken}` : "";
    const message =
      `Ciao ${name}, ti ricordiamo il tuo appuntamento.\n\n` +
      `Data: ${date}\n` +
      `Ora: ${time}\n` +
      (serviceName ? `Servizio: ${serviceName}\n` : "") +
      (cancelUrl
        ? `\nSe devi annullare in autonomia, usa questo link fino a 2 ore prima:\n${cancelUrl}\n`
        : "") +
      `\nA presto.`;

    openWhatsapp(phone, message);
  };

  return (
    <button
      type="button"
      onClick={handleReminder}
      className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-2 rounded-xl text-xs font-bold transition"
    >
      Promemoria
    </button>
  );
}

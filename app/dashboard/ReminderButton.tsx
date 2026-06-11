"use client";

export default function ReminderButton({ name, date, time, phone }: { name: string, date: string, time: string, phone: string }) {
  const handleClick = () => {
    // Puliamo il numero da spazi o caratteri strani
    const cleanPhone = phone.replace(/\D/g, "");
    
    // Messaggio precompilato per il cliente
    const text = encodeURIComponent(`Ciao ${name}, ti confermo l'appuntamento da Messaggio Demo NeatX il ${date} alle ${time}. Ti aspetto!`);
    
    // Apre la chat di WhatsApp direttamente con il numero del cliente e il messaggio
    window.open(`https://wa.me/39${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      className="text-purple-400 hover:text-purple-300 text-xs font-bold px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition border border-purple-500/20 hover:border-purple-500/40 ml-2"
    >
      Promemoria
    </button>
  );
}
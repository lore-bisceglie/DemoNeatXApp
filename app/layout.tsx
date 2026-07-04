import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Mail } from "lucide-react";
import InstagramFloatingBtn from "@/components/InstagramFloatingBtn";

// ✅ 1. QUESTO È IL TRUCCO PER LA BARRA DI STATO DEGLI SMARTPHONE
export const viewport: Viewport = {
  themeColor: "#050814",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.neatx.store"),
  title: "Demo NeatX | Prenotazioni", 
  description: "Prova una prenotazione demo in 10 secondi.",
  icons: {
    icon: "/apple-icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Demo NeatX | Prenotazioni", 
    description: "Prova una prenotazione demo in 10 secondi.",
    url: "https://www.neatx.store",
    siteName: "Demo NeatX",
    images: [
      {
        // 🔥 LINK ASSOLUTO: Costringe WhatsApp a trovare l'immagine!
        url: "https://www.neatx.store/preview.png", 
        width: 1200,
        height: 630,
      },
    ],
    locale: "it_IT",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="bg-[#050814] text-slate-200 antialiased relative">
        {children}
        
        {/* Gruppo Pulsanti Contatto */}
        <div className="fixed bottom-6 right-6 z-50 hidden sm:flex flex-col items-end gap-3">
          {/* Pulsante Fluttuante Email */}
          <a 
            href="mailto:neatx.info@gmail.com?subject=Richiesta%20App%20Personalizzata&body=Ciao,%20ho%20provato%20la%20demo%20e%20vorrei%20avere%20informazioni%20per%20creare%20la%20mia%20app%20NeatX%20personalizzata." 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
          >
            <Mail size={20} />
            Invia Email
          </a>

          {/* Pulsante Fluttuante Instagram (Apre App Nativa) */}
          <InstagramFloatingBtn />
        </div>
      </body>
    </html>
  );
}

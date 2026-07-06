import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Mail } from "lucide-react";
import InstagramFloatingBtn from "@/components/InstagramFloatingBtn";
import Chatbot from "@/components/Chatbot";

// ✅ 1. QUESTO È IL TRUCCO PER LA BARRA DI STATO DEGLI SMARTPHONE
export const viewport: Viewport = {
  themeColor: "#050814",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.neatx.store"),
  title: "NeatX | Agenda Online per Saloni e Professionisti — 0% Commissioni", 
  description: "Prenotazioni online, acconti, promemoria automatici. Zero commissioni. La tua agenda brandizzata che riempie gli slot mentre tu lavori. Prova gratis 7 giorni.",
  keywords: ["agenda online", "prenotazioni salone", "booking barbiere", "software gestione appuntamenti", "zero commissioni", "promemoria automatici", "neatx"],
  icons: {
    icon: "/apple-icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "NeatX | Agenda Online — 0% Commissioni", 
    description: "Prenotazioni online, acconti, promemoria automatici. Zero commissioni. Prova gratis 7 giorni.",
    url: "https://www.neatx.store",
    siteName: "NeatX",
    images: [
      {
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
        
        {/* Chatbot AI */}
        <Chatbot />

        {/* Gruppo Pulsanti Contatto (Spostati a Sinistra) */}
        <div className="fixed bottom-6 left-6 z-40 hidden sm:flex flex-col items-start gap-3">
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

        <div className="fixed bottom-4 left-4 z-40 sm:hidden">
          <InstagramFloatingBtn compact />
        </div>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Mail } from "lucide-react";
import InstagramFloatingBtn from "@/components/InstagramFloatingBtn";
import WhatsAppFloatingBtn from "@/components/WhatsAppFloatingBtn";
import EmailFloatingBtn from "@/components/EmailFloatingBtn";
import Chatbot from "@/components/Chatbot";
import GodmodeHub from "@/components/landing/GodmodeHub";
import PublicWidgetsWrapper from "@/components/landing/PublicWidgetsWrapper";
import GoogleTranslateWidget from "@/components/GoogleTranslateWidget";

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
        {/* Iubenda Cookie Banner Script */}
        <Script 
          src="https://embeds.iubenda.com/widgets/490bbed2-0c2c-47c4-9e1e-80f16c5f0787.js" 
          strategy="beforeInteractive" 
        />
        
        {children}
        
        {/* Traduttore Universale di Google (Sempre Visibile) */}
        <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9999] pointer-events-auto">
          <GoogleTranslateWidget />
        </div>

        <PublicWidgetsWrapper>
          {/* Chatbot AI */}
          <Chatbot />

          {/* Nuova Pila di Bottoni (In Basso a Sinistra) */}
          <div className="fixed bottom-16 left-4 sm:bottom-20 sm:left-6 z-[9998] flex flex-col items-start gap-3 pointer-events-none">
            {/* I bottoni devono avere pointer-events-auto per essere cliccabili */}

            <div className="pointer-events-auto">
              {/* Pulsante Fluttuante Email */}
              <div className="sm:hidden"><EmailFloatingBtn compact /></div>
              <div className="hidden sm:block"><EmailFloatingBtn /></div>
            </div>

            <div className="pointer-events-auto">
              {/* Pulsante Fluttuante Instagram */}
              <div className="sm:hidden"><InstagramFloatingBtn compact /></div>
              <div className="hidden sm:block"><InstagramFloatingBtn /></div>
            </div>

            <div className="hidden sm:block pointer-events-auto">
              {/* Pulsante Fluttuante WhatsApp (solo desktop, in coda) */}
              <WhatsAppFloatingBtn />
            </div>
          </div>
        </PublicWidgetsWrapper>

        {/* Menu Segreto per il Proprietario del SaaS (visibile solo a te) */}
        <GodmodeHub />
      </body>
    </html>
  );
}

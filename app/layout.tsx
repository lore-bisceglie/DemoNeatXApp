import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Mail } from "lucide-react";
import InstagramFloatingBtn from "@/components/InstagramFloatingBtn";
import WhatsAppFloatingBtn from "@/components/WhatsAppFloatingBtn";
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
        
        <PublicWidgetsWrapper>
          {/* Chatbot AI */}
          <Chatbot />

          {/* Gruppo Pulsanti Contatto (Spostati a Sinistra) */}
          <div className="fixed bottom-6 left-6 z-40 hidden sm:flex flex-col items-start gap-3">
            {/* Pulsante Fluttuante WhatsApp */}
            <WhatsAppFloatingBtn />

            {/* Pulsante Fluttuante Instagram (Apre App Nativa) */}
            <InstagramFloatingBtn />
          </div>

          <div className="fixed bottom-4 left-4 z-40 sm:hidden">
            <InstagramFloatingBtn compact />
          </div>
        </PublicWidgetsWrapper>

        {/* Menu Segreto per il Proprietario del SaaS (visibile solo a te) */}
        <GodmodeHub />

        {/* Traduttore Universale di Google */}
        <GoogleTranslateWidget />
      </body>
    </html>
  );
}

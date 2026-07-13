import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Mail } from "lucide-react";
import SocialFloatingGroup from "@/components/landing/SocialFloatingGroup";
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
  description: "Prenotazioni online, acconti, promemoria automatici. Zero commissioni. La tua agenda brandizzata che riempie gli slot mentre tu lavori. Prova gratis 14 giorni.",
  keywords: ["agenda online", "prenotazioni salone", "booking barbiere", "software gestione appuntamenti", "zero commissioni", "promemoria automatici", "neatx"],
  icons: {
    icon: "/apple-icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "NeatX | Agenda Online — 0% Commissioni", 
    description: "Prenotazioni online, acconti, promemoria automatici. Zero commissioni. Prova gratis 14 giorni.",
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
        
        {/* Kill iubenda floating badge/widget on mobile */}
        <Script id="kill-iubenda" strategy="afterInteractive">
          {`(() => {
            const kill = () => {
              // Selectors for iubenda floating elements
              const selectors = [
                '#iubenda-cookie-banner',
                '.iubenda-cs-banner',
                '.iubenda-cs-floating-button',
                '.iubenda-cs-close-btn',
                '[id^="iubenda-"]',
                '[class*="iubenda"]',
                'iframe[src*="iubenda"]',
              ];
              selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                  if (el.tagName === 'IFRAME' || el.offsetWidth > 0 || el.offsetHeight > 0) {
                    el.style.display = 'none !important';
                    el.style.visibility = 'hidden !important';
                    el.style.opacity = '0 !important';
                    el.style.pointerEvents = 'none !important';
                    el.style.position = 'absolute !important';
                    el.style.left = '-9999px !important';
                  }
                });
              });
            };
            // Run immediately
            kill();
            // Observe for late-injected elements
            const obs = new MutationObserver(kill);
            obs.observe(document.body, { childList: true, subtree: true });
            // Re-run periodically for 10s
            let t = 0;
            const iv = setInterval(() => { kill(); if (++t > 20) clearInterval(iv); }, 500);
          })();`}
        </Script>
        
        {/* Traduttore Universale di Google (Sempre Visibile) */}
        <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[9999] pointer-events-auto">
          <GoogleTranslateWidget />
        </div>

        <PublicWidgetsWrapper>
          {/* Chatbot AI */}
          <Chatbot />

          {/* Social bar — verticale, glass, a sinistra */}
          <div className="fixed bottom-16 sm:bottom-20 left-4 sm:left-6 z-[9998] pointer-events-auto">
            <SocialFloatingGroup />
          </div>
        </PublicWidgetsWrapper>

        {/* Menu Segreto per il Proprietario del SaaS (visibile solo a te) */}
        <GodmodeHub />
      </body>
    </html>
  );
}

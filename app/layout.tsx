import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import "driver.js/dist/driver.css";
import SocialFloatingGroup from "@/components/landing/SocialFloatingGroup";
import Chatbot from "@/components/Chatbot";
import GodmodeHub from "@/components/landing/GodmodeHub";
import PublicWidgetsWrapper from "@/components/landing/PublicWidgetsWrapper";
import GoogleTranslateWidget from "@/components/GoogleTranslateWidget";
import IubendaWrapper from "@/components/IubendaWrapper";

// ✅ 1. QUESTO È IL TRUCCO PER LA BARRA DI STATO DEGLI SMARTPHONE
export const viewport: Viewport = {
  themeColor: "#050814",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        {/* Iubenda Cookie Banner Script (Conditionally Loaded) */}
        <IubendaWrapper />
        
        {/* SEO Schema.org (JSON-LD) */}
        {/* Organization — il publisher di NeatX, citato dalle AI e dalle pagine articolo */}
        <Script id="schema-organization" type="application/ld+json" strategy="beforeInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://www.neatx.store/#organization",
              "name": "NeatX",
              "url": "https://www.neatx.store",
              "logo": "https://www.neatx.store/preview.png",
              "sameAs": [
                "https://www.neatx.store"
              ],
              "description": "NeatX è la piattaforma di agenda online e prenotazioni per saloni, barbieri, parrucchieri e centri estetici in Italia. Zero commissioni sui tuoi incassi."
            }
          `}
        </Script>
        <Script id="schema-software" type="application/ld+json" strategy="beforeInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "NeatX",
              "operatingSystem": "Web",
              "applicationCategory": "BusinessApplication",
              "applicationSubCategory": "Agenda appuntamenti e prenotazioni online",
              "offers": {
                "@type": "Offer",
                "price": "29",
                "priceCurrency": "EUR"
              },
              "description": "Software gestionale e agenda appuntamenti online zero commissioni per saloni, barbieri e centri estetici in Italia. I clienti prenotano da soli 24/7, gli acconti si incassano con Stripe, zero commissioni sulle prenotazioni."
            }
          `}
        </Script>

        {children}
        
        {/* Fix iubenda: restore body scroll when modal closes */}
        <Script id="fix-iubenda-scroll" strategy="afterInteractive">
          {`(() => {
            const restoreScroll = () => {
              document.body.style.overflow = '';
              document.body.style.position = '';
              document.body.style.width = '';
              document.documentElement.style.overflow = '';
            };
            // Observe iubenda modal open/close
            const obs = new MutationObserver(() => {
              const modal = document.querySelector('#iubenda-cookie-banner, .iubenda-cs-banner, [id^="iubenda-"][role="dialog"], .iubenda-cs-modal');
              if (modal) {
                const isOpen = modal.getAttribute('aria-hidden') !== 'true' && !modal.classList.contains('hidden') && modal.offsetParent !== null;
                if (!isOpen) restoreScroll();
              }
            });
            obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-hidden', 'class', 'style'] });
            // Also catch ESC key / click outside
            document.addEventListener('keydown', e => { if (e.key === 'Escape') setTimeout(restoreScroll, 100); });
            document.addEventListener('click', e => {
              if (e.target.id === 'iubenda-cookie-banner' || e.target.closest?.('.iubenda-cs-close-btn, .iubenda-cs-overlay')) {
                setTimeout(restoreScroll, 100);
              }
            });
            // Periodic safety net
            let t = 0;
            const iv = setInterval(() => {
              const modal = document.querySelector('#iubenda-cookie-banner, .iubenda-cs-banner');
              if (modal && modal.getAttribute('aria-hidden') === 'true') restoreScroll();
              if (++t > 30) clearInterval(iv);
            }, 1000);
          })();`}
        </Script>
        
        {/* Traduttore Universale di Google (Sempre Visibile) */}
        <div className="fixed bottom-24 left-4 sm:bottom-6 sm:left-6 z-[10051] pointer-events-auto">
          <GoogleTranslateWidget />
        </div>

        <PublicWidgetsWrapper>
          {/* Chatbot AI */}
          <Chatbot />

          {/* Social bar — verticale, glass, a sinistra. */}
          <div className="fixed bottom-[8.75rem] sm:bottom-20 left-4 sm:left-6 z-[10050] pointer-events-auto">
            <SocialFloatingGroup />
          </div>
        </PublicWidgetsWrapper>

        {/* Menu Segreto per il Proprietario del SaaS (visibile solo a te) */}
        <GodmodeHub />
      </body>
    </html>
  );
}

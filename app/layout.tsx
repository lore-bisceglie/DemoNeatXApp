import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
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
        
        {/* SEO Schema.org (JSON-LD) */}
        <Script id="schema-software" type="application/ld+json" strategy="beforeInteractive">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "NeatX",
              "operatingSystem": "Web",
              "applicationCategory": "BusinessApplication",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
              },
              "description": "Software gestionale e agenda appuntamenti online zero commissioni per saloni, barbieri e centri estetici in Italia."
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
        <div className="fixed bottom-3 left-0 sm:bottom-6 sm:left-6 z-[9999] pointer-events-auto">
          <GoogleTranslateWidget />
        </div>

        <PublicWidgetsWrapper>
          {/* Chatbot AI */}
          <Chatbot />

          {/* Social bar — verticale, glass, a sinistra. */}
          <div className="fixed bottom-24 sm:bottom-20 left-4 sm:left-6 z-[9998] pointer-events-auto">
            <SocialFloatingGroup />
          </div>
        </PublicWidgetsWrapper>

        {/* Menu Segreto per il Proprietario del SaaS (visibile solo a te) */}
        <GodmodeHub />
      </body>
    </html>
  );
}

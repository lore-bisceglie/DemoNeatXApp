import type { Metadata, Viewport } from "next";
import "./globals.css";

// ✅ 1. QUESTO È IL TRUCCO PER LA BARRA DI STATO DEGLI SMARTPHONE
export const viewport: Viewport = {
  themeColor: "#050814",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://demo-neatx-app.vercel.app"),
  title: "Demo NeatX | Prenotazioni", 
  description: "Prova una prenotazione demo in 10 secondi.",
  icons: {
    icon: "/apple-icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Demo NeatX | Prenotazioni", 
    description: "Prova una prenotazione demo in 10 secondi.",
    url: "https://demo-neatx-app.vercel.app",
    siteName: "Demo NeatX",
    images: [
      {
        // 🔥 LINK ASSOLUTO: Costringe WhatsApp a trovare l'immagine!
        url: "https://demo-neatx-app.vercel.app/preview.png", 
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
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {/* Pulsante Fluttuante Email */}
          <a 
            href="mailto:neatx.info@gmail.com?subject=Richiesta App Personalizzata&body=Ciao, ho provato la demo e vorrei avere informazioni per creare la mia app NeatX personalizzata." 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Invia Email
          </a>

          {/* Pulsante Fluttuante Instagram */}
          <a 
            href="https://www.instagram.com/neatx_agenda?utm_source=qr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
            Scrivici su IG
          </a>
        </div>
      </body>
    </html>
  );
}
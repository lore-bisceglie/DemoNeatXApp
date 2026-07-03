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
        
        {/* Pulsante Fluttuante Instagram */}
        <a 
          href="https://www.instagram.com/neatx_agenda?utm_source=qr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
          </svg>
          Richiedi l'App
        </a>
      </body>
    </html>
  );
}
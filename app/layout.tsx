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
      <body className="bg-[#050814] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
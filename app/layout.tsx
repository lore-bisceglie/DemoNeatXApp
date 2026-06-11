import type { Metadata, Viewport } from "next";
import "./globals.css";

// ✅ 1. QUESTO È IL TRUCCO PER LA BARRA DI STATO DEGLI SMARTPHONE
export const viewport: Viewport = {
  themeColor: "#050814",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://neatx-mito.vercel.app"),
  title: "Agenda NeatX | Prenota Ora", // 🌟 TITOLO DELLA SCHEDA AGGIORNATO
  description: "Prenota il tuo appuntamento in 10 secondi comodamente online.",
  openGraph: {
    title: "Agenda NeatX", // 🌟 TITOLO WHATSAPP AGGIORNATO
    description: "Scegli il giorno e l'orario e prenota in 10 secondi.",
    url: "https://neatx-mito.vercel.app",
    siteName: "Agenda NeatX", // 🌟 NOME SITO AGGIORNATO
    images: [
      {
        url: "/preview.png", 
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
      {/* ✅ 2. HO RESO IL BODY SCURO PER EVITARE IL "RIMBALZO BIANCO" SU IPHONE */}
      <body className="bg-[#050814] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
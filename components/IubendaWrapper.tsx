"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export default function IubendaWrapper() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const hn = window.location.hostname;
    if (hn === "localhost" || hn === "neatx.store" || hn === "www.neatx.store" || hn.includes("vercel.app")) {
      setShouldRender(true);
    }
  }, []);

  if (!shouldRender) return null;

  return (
    <Script 
      src="https://embeds.iubenda.com/widgets/490bbed2-0c2c-47c4-9e1e-80f16c5f0787.js" 
      strategy="afterInteractive" 
    />
  );
}

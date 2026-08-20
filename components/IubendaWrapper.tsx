"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function IubendaWrapper() {
  const pathname = usePathname();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const hn = window.location.hostname;
    if (hn === "localhost" || hn === "neatx.store" || hn === "www.neatx.store" || hn.includes("vercel.app")) {
      setShouldRender(true);
    }
  }, []);

  // Iubenda injects banner nodes directly into <body>. Do not load it on the
  // login screen, where that external mutation can race React during route
  // transitions and trigger a DOM insertBefore NotFoundError.
  if (!shouldRender || pathname === "/login") return null;

  return (
    <Script 
      src="https://embeds.iubenda.com/widgets/490bbed2-0c2c-47c4-9e1e-80f16c5f0787.js" 
      strategy="afterInteractive" 
    />
  );
}

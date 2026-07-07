"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PublicWidgetsWrapper({ children }: { children: React.ReactNode }) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Controllo se esiste il cookie segreto
    if (document.cookie.includes("superadmin_god_eye=true")) {
      setIsSuperAdmin(true);
    }
  }, []);

  // Evita hydration errors non renderizzando nulla finché non è montato
  if (!mounted) return null;

  // Sulle pagine pubbliche dei clienti (/t/...), non mostrare i widget della Landing Page
  if (pathname?.startsWith("/t/")) return null;

  // Se sei il SuperAdmin (hai il cookie), disattiva i widget pubblici
  if (isSuperAdmin) return null;

  // Altrimenti mostra i widget normalmente sulla Landing
  return <>{children}</>;
}

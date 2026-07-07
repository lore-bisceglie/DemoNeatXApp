"use client";

import { useState, useEffect } from "react";

export default function PublicWidgetsWrapper({ children }: { children: React.ReactNode }) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Controllo se esiste il cookie segreto
    if (document.cookie.includes("superadmin_god_eye=true")) {
      setIsSuperAdmin(true);
    }
  }, []);

  // Evita hydration errors non renderizzando nulla finché non è montato
  if (!mounted) return null;

  // Se sei il SuperAdmin (hai il cookie), disattiva i widget pubblici (Chatbot, Whatsapp, Instagram)
  if (isSuperAdmin) return null;

  // Altrimenti mostra i widget normalmente
  return <>{children}</>;
}

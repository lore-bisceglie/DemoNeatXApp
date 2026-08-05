"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PublicWidgetsWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [show, setShow] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isMainDomain =
      hostname === "localhost" ||
      hostname === "neatx.store" ||
      hostname === "www.neatx.store" ||
      hostname.includes("vercel.app");
    const isSuperAdmin = document.cookie.includes("superadmin_god_eye=true");
    setShow(isMainDomain && !isSuperAdmin);
  }, []);

  if (pathname?.startsWith("/t/") || pathname?.startsWith("/staff/") || pathname?.startsWith("/godmode") || !show) return null;
  return <>{children}</>;
}

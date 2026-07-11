"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PublicWidgetsWrapper({ children }: { children: React.ReactNode }) {
  const [shouldRender, setShouldRender] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const hostname = window.location.hostname;
    const isMainDomain =
      hostname === "localhost" ||
      hostname === "neatx.store" ||
      hostname === "www.neatx.store" ||
      hostname.includes("vercel.app");

    const isSuperAdmin = document.cookie.includes("superadmin_god_eye=true");

    if (!isMainDomain || pathname?.startsWith("/t/") || isSuperAdmin) {
      setShouldRender(false);
    }
  }, [pathname]);

  return <div style={{ display: shouldRender ? "" : "none" }}>{children}</div>;
}

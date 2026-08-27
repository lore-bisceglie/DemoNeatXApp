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
      hostname === "192.168.1.8" ||
      hostname === "neatx.store" ||
      hostname === "www.neatx.store" ||
      hostname.includes("vercel.app");
    // A superadmin session should not hide public conversion widgets while
    // previewing the home page. Keep them hidden only inside admin surfaces.
    const isAdminSurface = pathname?.startsWith("/superadmin") || pathname?.startsWith("/godmode");
    setShow(isMainDomain && !isAdminSurface);
  }, [pathname]);

  if (pathname?.startsWith("/t/") || pathname?.startsWith("/staff/") || pathname?.startsWith("/godmode") || !show) return null;
  return <>{children}</>;
}

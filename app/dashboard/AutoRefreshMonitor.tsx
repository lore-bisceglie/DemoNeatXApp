"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function AutoRefreshMonitor({ appointmentCount: _appointmentCount }: { appointmentCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 🌟 IMPOSTATO A 3 MINUTI (180.000 millisecondi)
    const interval = setInterval(() => {
      const currentParams = searchParams.toString();
      const currentUrl = currentParams ? `${pathname}?${currentParams}` : pathname;
      router.replace(currentUrl, { scroll: false });
    }, 180000); 

    return () => clearInterval(interval);
  }, [pathname, searchParams, router]);

  return null;
}
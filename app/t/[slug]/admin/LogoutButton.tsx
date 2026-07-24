"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ slug, className }: { slug: string; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    if (loading) return;
    setLoading(true);
    await fetch("/api/tenant-logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
    }).catch(() => null);
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={className || "col-span-3 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50 sm:col-span-1"}
    >
      <LogOut size={16} /> {loading ? "Uscita..." : "Esci"}
    </button>
  );
}

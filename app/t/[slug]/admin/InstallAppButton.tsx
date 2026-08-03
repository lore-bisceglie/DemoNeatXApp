"use client";

import { Download, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);
    setIsIos(/iPad|iPhone|iPod/.test(window.navigator.userAgent));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setIsStandalone(true);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isStandalone) return null;

  const install = async () => {
    if (!installEvent) {
      setShowHelp(true);
      return;
    }

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  return (
    <div className="relative col-span-2 sm:col-span-1">
      <button
        id="tour-install-app"
        type="button"
        onClick={install}
        className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
      >
        <Download size={16} />
        Installa NeatX
      </button>

      {showHelp && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-cyan-400/30 bg-[#0b1221] p-4 text-xs leading-relaxed text-slate-300 shadow-2xl">
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            aria-label="Chiudi istruzioni installazione"
            className="absolute right-2 top-2 rounded-lg p-1 text-slate-500 hover:text-white"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-2 pr-4">
            <Smartphone size={17} className="mt-0.5 shrink-0 text-cyan-300" />
            <p>
              {isIos
                ? "Su iPhone premi Condividi, poi Aggiungi alla schermata Home."
                : "Il browser non mostra ancora il comando automatico. Apri il menu del browser e scegli Installa app o Aggiungi alla schermata Home."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { ThemeConfig } from "../types";
import { activityProfiles } from "../constants";

interface ActivitySelectionModalProps {
  show: boolean;
  onClose: () => void;
  onChooseActivity: (profileId: string) => void;
  th: ThemeConfig;
}

export function ActivitySelectionModal({
  show,
  onClose,
  onChooseActivity,
  th,
}: ActivitySelectionModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`bg-[#0b1221] border p-6 rounded-3xl shadow-2xl max-w-lg w-full text-center animate-in fade-in zoom-in duration-200 ${th.borderMain} ${th.shadowMain}`}>
        <div className="text-4xl mb-3">🚀</div>
        <h3 className="text-xl font-extrabold text-white mb-2">
          Scegli che demo vuoi provare
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-5">
          Ogni profilo filtra i servizi e prepara dati finti coerenti con
          quell'attività. Puoi cambiare scelta anche dopo.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          {activityProfiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => onChooseActivity(profile.id)}
              className="bg-[#131c31] hover:bg-[#1a2642] border border-[#1e2b4a] hover:border-[#00b4ff]/60 rounded-2xl px-3 py-3 text-left transition-all duration-150 active:scale-95 hover:scale-[1.03]"
            >
              <span className="block text-2xl mb-2">{profile.icon}</span>
              <span className="block text-sm font-extrabold text-white">
                {profile.label}
              </span>
              <span className="block text-[10px] text-slate-500 mt-1 leading-snug">
                {profile.description}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-400 hover:text-white underline underline-offset-4"
        >
          Entra senza scegliere
        </button>
      </div>
    </div>
  );
}

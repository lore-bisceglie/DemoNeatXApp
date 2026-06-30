"use client";

import Swal from "sweetalert2";
import { useState } from "react";

export default function ExportAgendaButton({ tenantId }: { tenantId: string }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    Swal.fire({
      title: "Preparazione Export...",
      text: "Stiamo generando il file CSV con la tua agenda...",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      setLoading(true);
      window.location.href = `/api/export/appointments?tenantId=${tenantId}`;
      setTimeout(() => {
        Swal.fire({
          title: "Fatto!",
          text: "L'esportazione dell'agenda è pronta.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        setLoading(false);
      }, 1500);
    } catch (e) {
      setLoading(false);
      Swal.fire("Errore", "Si è verificato un errore", "error");
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 whitespace-nowrap text-sm"
    >
      <span>📥</span> Esporta Agenda (CSV)
    </button>
  );
}

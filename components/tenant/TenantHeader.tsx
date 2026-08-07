import React, { CSSProperties } from "react";
import { ThemeConfig, TenantInfoType, PublicLocation } from "./types";

interface TenantHeaderProps {
  tenantInfo: TenantInfoType;
  selectedLocation: PublicLocation | null;
  th: ThemeConfig;
  logoClicked: boolean;
  handleLogoClick: () => void;
  isPlaygroundDemo: boolean;
  effectiveServicePrice: number | null;
  hasSelectedService: boolean;
}

export function TenantHeader({
  tenantInfo,
  selectedLocation,
  th,
  logoClicked,
  handleLogoClick,
  isPlaygroundDemo,
  effectiveServicePrice,
  hasSelectedService,
}: TenantHeaderProps) {
  const formatSocialUrl = (url: string, platform: 'instagram' | 'tiktok') => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const clean = url.replace(/^@/, '');
    return `https://${platform}.com/${clean}`;
  };

  return (
    <div className="text-center mb-8">
      <div className="flex flex-col items-center justify-center mb-10 relative">
        <style>{`
          @keyframes demoHaloSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes demoSoftPulse {
            0%, 100% { opacity: .35; transform: scale(.96); }
            50% { opacity: .72; transform: scale(1.06); }
          }
          @keyframes demoSweep {
            0% { transform: translateX(-140%) rotate(22deg); opacity: 0; }
            35% { opacity: .85; }
            100% { transform: translateX(140%) rotate(22deg); opacity: 0; }
          }
          @keyframes demoHeartbeat {
            0%   { transform: scale(1); }
            14%  { transform: scale(1.08); }
            28%  { transform: scale(1); }
            42%  { transform: scale(1.08); }
            70%  { transform: scale(1); }
            100% { transform: scale(1); }
          }
        `}</style>

        <button
          type="button"
          onClick={handleLogoClick}
          aria-label={isPlaygroundDemo ? "Attiva effetto logo demo NeatX" : `Attiva effetto logo ${tenantInfo.name}`}
          className="group relative w-32 h-32 rounded-full flex items-center justify-center cursor-pointer focus:outline-none"
          style={{
            transition: "transform 1000ms cubic-bezier(0.16, 1, 0.3, 1)",
            transform: logoClicked ? "rotate(360deg) scale(1.06)" : "rotate(0deg) scale(1)",
            animation: logoClicked ? "demoHeartbeat 1.4s ease-out 0.1s" : undefined,
            zIndex: 51,
          }}
        >
          <span
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, #${th.mainHex}80, transparent 72%)`,
              animation: logoClicked
                ? "demoSoftPulse .7s ease-in-out infinite"
                : "demoSoftPulse 3.2s ease-in-out infinite",
            }}
          />
          <span
            className="absolute inset-3 rounded-full"
            style={{
              background: `conic-gradient(from 90deg, transparent, #${th.mainHex}, #ffffff, #${th.mainHex}80, transparent)`,
              filter: `drop-shadow(0 0 12px #${th.mainHex}99)`,
              animation: logoClicked
                ? "demoHaloSpin .75s linear infinite"
                : "demoHaloSpin 7s linear infinite",
            }}
          />
          <span className="absolute inset-[18px] rounded-full bg-[#050814]" />
          <span
            className="absolute inset-[14px] rounded-full opacity-60"
            style={{
              background: "linear-gradient(135deg, rgba(0,180,255,.45), transparent 38%, rgba(236,72,153,.35) 70%, rgba(255,255,255,.28))",
              filter: "blur(5px)",
            }}
          />
          <span className={`relative w-24 h-24 rounded-full p-1 bg-[#0b1221] overflow-hidden ${th.avatarShadow}`}>
            {tenantInfo.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenantInfo.logoUrl}
                alt={tenantInfo.name}
                draggable={false}
                className="w-full h-full object-cover rounded-full border-4 border-[#0b1221] relative"
                style={{ zIndex: 52 }}
              />
            ) : isPlaygroundDemo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/apple-icon.png"
                alt="Logo Demo NeatX"
                className="w-full h-full object-cover rounded-full border-4 border-[#0b1221]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tenantInfo.name)}&background=0b1221&color=${th.mainHex}&size=150&bold=true`}
                alt={tenantInfo.name}
                draggable={false}
                className="w-full h-full object-cover rounded-full border-4 border-[#0b1221] relative"
                style={{ zIndex: 52 }}
              />
            )}
            <span
              className={`absolute inset-y-[-20%] left-0 w-10 bg-white/35 blur-sm ${logoClicked ? "block" : "hidden"}`}
              style={{ animation: "demoSweep .9s ease-out both" }}
            />
          </span>

        </button>

        {logoClicked && (
          <div className="absolute -bottom-8 text-sm font-bold text-[#00b4ff] animate-in fade-in slide-in-from-top-2 zoom-in duration-200 z-10 whitespace-nowrap">
            {isPlaygroundDemo ? "Demo pronta da provare" : `${tenantInfo.name} online`}
          </div>
        )}
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex justify-center items-center gap-3 flex-wrap">
        <span className="text-slate-100">{tenantInfo.name}</span>
        {hasSelectedService && effectiveServicePrice != null && effectiveServicePrice > 0 && (
          <span className={`px-3 py-1 rounded-full border text-sm align-middle animate-in zoom-in duration-300 ${th.badgeBg} ${th.textMain} ${th.borderMain}`}>
            {effectiveServicePrice}€
          </span>
        )}
      </h1>

      <p className="text-slate-400 text-[13px] font-medium mb-5 leading-relaxed">
        {tenantInfo.description || "Il tuo stile impeccabile, a portata di click. ✂️"}
      </p>

      <div className="mb-6 flex flex-col items-center justify-center gap-4 transition-all duration-200">
        {(selectedLocation?.mapsLink || (!selectedLocation && tenantInfo.mapsLink)) ? (
          <a href={selectedLocation?.mapsLink || tenantInfo.mapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center justify-center gap-2 animate-in fade-in duration-300 text-center font-semibold bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-full border border-blue-500/20">
            📍 {selectedLocation?.address || tenantInfo.address}
          </a>
        ) : (
          <p className="text-blue-300 text-sm flex items-center justify-center gap-1 animate-in fade-in duration-300 text-center font-semibold bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
            📍 {selectedLocation?.address || tenantInfo.address}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 justify-center">
          {tenantInfo.instagramUrl && (
            <a
              href={formatSocialUrl(tenantInfo.instagramUrl, 'instagram')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-300 hover:via-pink-400 hover:to-purple-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-extrabold shadow-lg shadow-pink-500/30 transition-all duration-150 active:scale-90 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>Instagram</span>
            </a>
          )}
          {tenantInfo.tiktokUrl && (
            <a
              href={formatSocialUrl(tenantInfo.tiktokUrl, 'tiktok')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-200 text-[#050814] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-extrabold shadow-lg shadow-black/30 transition-all duration-150 active:scale-90 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
              <span>TikTok</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

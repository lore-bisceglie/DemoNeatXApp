"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "no", name: "Norsk", flag: "🇳🇴" },
];

export default function GoogleTranslateWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("it");

  useEffect(() => {
    // Nascondiamo COMPLETAMENTE il widget originale di Google
    const style = document.createElement("style");
    style.innerHTML = `
      .skiptranslate iframe {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      #google_translate_element {
        position: fixed;
        top: -9999px;
        left: -9999px;
        opacity: 0.01;
        z-index: -1;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const changeLanguage = (langCode: string) => {
    // 1. Fallback tramite Cookie
    document.cookie = `googtrans=/it/${langCode}; path=/;`;
    document.cookie = `googtrans=/it/${langCode}; path=/; domain=${window.location.hostname}`;
    
    // 2. Metodo primario: Combo Box (se Google è riuscito a renderizzarla)
    let reloadRequired = true;
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
      reloadRequired = false; // Ha funzionato, non serve ricaricare
    }
    
    setCurrentLang(langCode);
    setIsOpen(false);
    
    // 3. Se la Combo Box non c'era, forziamo il ricaricamento per far leggere i Cookie
    if (reloadRequired) {
      window.location.reload();
    }
  };

  return (
    <>
      {/* Contenitore invisibile per Google */}
      <div id="google_translate_element"></div>

      <Script 
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
        strategy="afterInteractive" 
      />

      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function() {
            new window.google.translate.TranslateElement({
              pageLanguage: 'it',
              includedLanguages: 'it,en,es,fr,de,no',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            }, 'google_translate_element');
          }
        `}
      </Script>

      {/* Il nostro Widget Custom Bello - Spostato a sinistra su mobile per non accavallarsi */}
      <div className="fixed bottom-24 left-4 sm:bottom-6 sm:right-24 sm:left-auto z-[9999] flex flex-col sm:items-end">
        {isOpen && (
          <div className="mb-2 bg-[#0b1221] border border-[#1e2b4a] rounded-xl shadow-2xl p-2 w-40 animate-in fade-in slide-in-from-bottom-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  currentLang === lang.code 
                    ? "bg-cyan-500/20 text-cyan-400 font-medium" 
                    : "text-slate-300 hover:bg-[#1e2b4a] hover:text-white"
                }`}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        )}
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#0b1221] border border-[#1e2b4a] text-slate-300 hover:text-white p-3 rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center group"
          aria-label="Cambia Lingua"
        >
          <Globe className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </>
  );
}

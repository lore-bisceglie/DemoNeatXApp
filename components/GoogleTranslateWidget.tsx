"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function GoogleTranslateWidget() {
  useEffect(() => {
    // Aggiungiamo un po' di CSS per nascondere il banner brutto di Google in alto
    const style = document.createElement("style");
    style.innerHTML = `
      .skiptranslate iframe {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .goog-te-gadget {
        color: transparent !important;
      }
      .goog-te-gadget .goog-te-combo {
        color: white;
        background: #0b1221;
        border: 1px solid #1e2b4a;
        padding: 5px;
        border-radius: 8px;
        font-size: 12px;
        outline: none;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <div 
        id="google_translate_element" 
        className="fixed bottom-24 right-4 z-[9999] opacity-80 hover:opacity-100 transition-opacity drop-shadow-xl"
      ></div>

      <Script 
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
        strategy="afterInteractive" 
      />

      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function() {
            new window.google.translate.TranslateElement({
              pageLanguage: 'it',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            }, 'google_translate_element');
          }
        `}
      </Script>
    </>
  );
}

const fs = require('fs');
const p = 'app/page.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Imports
if (!c.includes('import FloatingPhone')) {
  c = c.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\nimport FloatingPhone from "@/components/landing/FloatingPhone";\nimport BeforeAfterSlider from "@/components/landing/BeforeAfterSlider";\nimport ApplicationModal from "@/components/landing/ApplicationModal";');
}

// 2. State for Elite Application Modal
if (!c.includes('showAppModal')) {
  c = c.replace('const [showRoiModal, setShowRoiModal] = useState(false);', 'const [showRoiModal, setShowRoiModal] = useState(false);\n  const [showAppModal, setShowAppModal] = useState(false);');
}

// 3. Floating Phone in Hero
const heroTarget = `{/* 3D GLASSMORPHISM MOCKUP */}
        <div className="mt-16 w-full max-w-4xl relative animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 delay-500 perspective-1000">`;

const phoneReplacement = `{/* 3D FLOATING IPHONE */}
        <FloatingPhone />
        
        {/* 3D GLASSMORPHISM MOCKUP (HIDDEN ON DESKTOP, OR REPLACED) */}
        <div className="hidden mt-16 w-full max-w-4xl relative animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 delay-500 perspective-1000">`;
c = c.replace(heroTarget, phoneReplacement);

// 4. BeforeAfterSlider
const featureTarget = `{/* FEATURES SECTION */}`;
const sliderReplacement = `{/* SLIDER PRIMA E DOPO */}
      <BeforeAfterSlider />
      
      {/* FEATURES SECTION */}`;
c = c.replace(featureTarget, sliderReplacement);

// 5. Elite Button -> Application Modal
const eliteBtnTarget = `<Link href="/demo" className="mt-8 w-full py-4 border border-[#1e2b4a] hover:bg-[#131c31] text-white font-bold rounded-xl transition-all text-center">
                Parla con noi
              </Link>`;
const eliteBtnReplacement = `<button onClick={() => setShowAppModal(true)} className="mt-8 w-full py-4 border border-purple-500/50 hover:bg-purple-900/20 text-white font-bold rounded-xl transition-all text-center shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:scale-105">
                Invia Candidatura
              </button>`;
c = c.replace(eliteBtnTarget, eliteBtnReplacement);

// 6. Inject ApplicationModal Component
const footerTarget = `{/* FOOTER */}`;
const modalReplacement = `<ApplicationModal isOpen={showAppModal} onClose={() => setShowAppModal(false)} />
      {/* FOOTER */}`;
c = c.replace(footerTarget, modalReplacement);

// 7. Add Glow Effect to features and pricing cards (via global mouse move in useEffect)
if (!c.includes('--mouse-x')) {
  const useEffectTarget = `  // Social Proof: Live Notifications
  useEffect(() => {`;
  
  const useEffectReplacement = `  // Glow Effect Mouse Tracker
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', \`\${e.clientX}px\`);
      document.documentElement.style.setProperty('--mouse-y', \`\${e.clientY}px\`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Social Proof: Live Notifications
  useEffect(() => {`;
  c = c.replace(useEffectTarget, useEffectReplacement);
  
  // Add global styles for glow in globals.css or inline
  const globalCss = `
        <style>{\`
          .glow-card {
            position: relative;
            z-index: 1;
          }
          .glow-card::before {
            content: "";
            position: absolute;
            top: -1px; left: -1px; right: -1px; bottom: -1px;
            border-radius: inherit;
            background: radial-gradient(
              600px circle at var(--mouse-x) var(--mouse-y), 
              rgba(0, 180, 255, 0.15),
              transparent 40%
            );
            z-index: -1;
            opacity: 0;
            transition: opacity 0.5s;
          }
          .glow-card:hover::before {
            opacity: 1;
          }
        \`}</style>
        
        {/* GLOW BACKGROUND EFFETTO DINAMICO */}`;
        
  c = c.replace(`{/* GLOW BACKGROUND EFFETTO DINAMICO */}`, globalCss);
  
  // Add glow-card class to feature cards
  c = c.replace(/className="bg-\[#050814\] p-8 rounded-3xl border border-\[#1a2642\] shadow-2xl/g, 'className="glow-card bg-[#050814] p-8 rounded-3xl border border-[#1a2642] shadow-2xl');
  
  // Add glow-card class to pricing cards
  c = c.replace(/className="bg-\[#0b1221\] p-8 rounded-3xl border border-\[#1a2642\] flex flex-col h-\[450px\]"/g, 'className="glow-card bg-[#0b1221] p-8 rounded-3xl border border-[#1a2642] flex flex-col h-[450px]"');
}

fs.writeFileSync(p, c);
console.log('Modifiche premium applicate');

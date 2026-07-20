"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustMarquee from "@/components/landing/TrustMarquee";
import BeforeAfterSlider from "@/components/landing/BeforeAfterSlider";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TimesheetFeatureSection from "@/components/landing/TimesheetFeatureSection";
import OperatingSteps from "@/components/landing/OperatingSteps";
import PricingSection from "@/components/landing/PricingSection";
import IntegrationsSection from "@/components/landing/IntegrationsSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import LiveNotification from "@/components/landing/LiveNotification";
import ROICalculator from "@/components/landing/ROICalculator";

export default function Home() {
  const [showRoiModal, setShowRoiModal] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#050814] text-slate-200 font-sans selection:bg-[#00b4ff]/30 overflow-x-hidden relative">
      
      <style>{`
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
      `}</style>
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#00b4ff]/10 blur-[150px] rounded-full pointer-events-none opacity-60 animate-pulse" />

      <Navbar onOpenRoi={() => setShowRoiModal(true)} />
      <HeroSection />
      <TrustMarquee />
      <TimesheetFeatureSection />
      <BeforeAfterSlider />
      <TestimonialsSection />
      <FeaturesSection />
      <OperatingSteps />
      <PricingSection />
      <ComparisonTable />
      <IntegrationsSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
      <LiveNotification />
      <ROICalculator show={showRoiModal} onClose={() => setShowRoiModal(false)} />
    </div>
  );
}

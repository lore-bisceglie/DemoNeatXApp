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
import ScrollReveal from "@/components/landing/ScrollReveal";

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
        @media (hover: hover) and (pointer: fine) {
          .glow-card:hover::before {
            opacity: 1;
          }
        }
      `}</style>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[#00b4ff]/10 blur-[150px] rounded-full pointer-events-none opacity-60 animate-pulse" />
      
      {/* VERCEL/STRIPE STYLE GRID BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff0f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_110%)]"></div>

      <Navbar onOpenRoi={() => setShowRoiModal(true)} />
      <HeroSection />
      
      <ScrollReveal><TrustMarquee /></ScrollReveal>
      <ScrollReveal direction="right"><TimesheetFeatureSection /></ScrollReveal>
      <ScrollReveal direction="left"><BeforeAfterSlider /></ScrollReveal>
      <ScrollReveal direction="up"><TestimonialsSection /></ScrollReveal>
      <ScrollReveal direction="left"><FeaturesSection /></ScrollReveal>
      <ScrollReveal direction="right"><OperatingSteps /></ScrollReveal>
      <PricingSection />
      <ScrollReveal direction="left"><ComparisonTable /></ScrollReveal>
      <ScrollReveal direction="right"><IntegrationsSection /></ScrollReveal>
      <ScrollReveal direction="up"><FAQSection /></ScrollReveal>
      <ScrollReveal><FinalCTA /></ScrollReveal>
      
      <Footer />
      <LiveNotification />
      <ROICalculator show={showRoiModal} onClose={() => setShowRoiModal(false)} />
    </div>
  );
}

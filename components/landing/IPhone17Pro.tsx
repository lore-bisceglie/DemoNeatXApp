"use client";

import React from "react";

interface IPhone17ProProps {
  children: React.ReactNode;
  className?: string;
}

export default function IPhone17Pro({ children, className = "" }: IPhone17ProProps) {
  return (
    <div 
      className={`relative perspective-1000 ${className}`}
      style={{ width: '320px', height: '650px', flexShrink: 0 }}
    >
      
      {/* Floating Animation Wrapper */}
      <div 
        className="w-full h-full relative"
        style={{
          animation: 'float-device 6s ease-in-out infinite',
        }}
      >
        <style>{`
          @keyframes float-device {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
        `}</style>
        
        {/* iPhone 17 Pro Chassis (Titanium Rim) */}
        <div className="absolute inset-0 rounded-[48px] shadow-2xl p-[4px] bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900 flex flex-col z-10"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 180, 255, 0.25), inset 0 0 0 1px rgba(255,255,255,0.2)'
          }}
        >
          {/* Inner Black Border & Screen */}
          <div className="w-full h-full bg-black rounded-[45px] overflow-hidden flex flex-col relative border-[5px] border-black">
            
            {/* Dynamic Island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full z-50 flex items-center justify-between px-2.5 shadow-md">
              <div className="w-2 h-2 rounded-full bg-[#111] shadow-[inset_0_0_1px_rgba(255,255,255,0.2)]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#0a0a2a] shadow-[inset_0_0_2px_rgba(255,255,255,0.3)] border border-white/5"></div>
            </div>

            {/* Screen Content */}
            <div className="flex-1 bg-white flex flex-col relative overflow-hidden">
              {children}
            </div>

          {/* Screen Reflections */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-50 rounded-[45px]"></div>
          
          </div>
          
          {/* Hardware Buttons (Volume & Power) */}
          <div className="absolute top-[120px] -left-[4px] w-[3px] h-[30px] bg-slate-600 rounded-l-md border-r border-slate-800"></div>
          <div className="absolute top-[170px] -left-[4px] w-[3px] h-[60px] bg-slate-600 rounded-l-md border-r border-slate-800"></div>
          <div className="absolute top-[240px] -left-[4px] w-[3px] h-[60px] bg-slate-600 rounded-l-md border-r border-slate-800"></div>
          <div className="absolute top-[180px] -right-[4px] w-[3px] h-[80px] bg-slate-600 rounded-r-md border-l border-slate-800"></div>
          
        </div>
      </div>
    </div>
  );
}

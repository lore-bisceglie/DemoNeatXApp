"use client";

import { useState, useCallback, Children, ReactNode, isValidElement } from "react";

type TabConfig = {
  id: string;
  label: string;
};

export default function TabbedArea({
  initialTab,
  tabConfig,
  slug,
  children,
}: {
  initialTab: string;
  tabConfig: TabConfig[];
  slug: string;
  children: ReactNode;
}) {
  const validTab = tabConfig.some((t) => t.id === initialTab) ? initialTab : tabConfig[0]?.id || "agenda";
  const [activeTab, setActiveTab] = useState(validTab);

  const handleTabClick = useCallback(
    (tabId: string) => {
      setActiveTab(tabId);
      window.history.replaceState(null, "", `/t/${slug}/admin?tab=${tabId}`);
    },
    [slug]
  );

  const activeChild = Children.toArray(children).find((child) => {
    if (isValidElement<{ "data-tab"?: string }>(child) && child.props["data-tab"] === activeTab) {
      return true;
    }
    return false;
  });

  return (
    <div className="pb-24 md:pb-0">
      <div className="fixed inset-x-2 bottom-2 z-50 flex gap-2 overflow-x-auto rounded-2xl border border-cyan-400/20 bg-[#0b1221]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl custom-scrollbar snap-x md:static md:inset-auto md:z-auto md:mb-6 md:rounded-none md:border-0 md:border-b md:border-[#1e2b4a] md:bg-transparent md:p-0 md:pb-4 md:shadow-none md:backdrop-blur-none md:gap-4">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            id={`tour-tab-${tab.id}`}
            type="button"
            onClick={() => handleTabClick(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 snap-start ${
              activeTab === tab.id
                ? "bg-[#00b4ff] text-[#050814] shadow-[0_0_10px_rgba(0,180,255,0.3)]"
                : "bg-[#131c31] text-slate-400 hover:text-white hover:bg-[#1a2642]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeChild}
    </div>
  );
}

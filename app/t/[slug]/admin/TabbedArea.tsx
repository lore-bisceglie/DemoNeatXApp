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
    <>
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 mb-6 border-b border-[#1e2b4a] custom-scrollbar snap-x">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
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
    </>
  );
}

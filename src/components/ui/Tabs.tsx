"use client";

import React from "react";
import { cn } from "./cn";

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Tabs — controlled, accessible pill tablist. Panels are managed by the caller;
 * this renders only the tab triggers. Client component (onChange handler).
 */
export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-1.5", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-pill px-3.5 py-2 text-[13px] font-semibold transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link",
              isActive
                ? "bg-ink text-white"
                : "text-muted hover:bg-surface-2",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;

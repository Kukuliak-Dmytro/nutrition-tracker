"use client";

import React from "react";
import { useAIAssistant } from "@/components/ai/AIAssistantContext";
import { AIChatSidebar } from "@/components/ai/AIChatSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, closeAssistant } = useAIAssistant();

  return (
    <div className="flex w-full flex-1 min-h-0 overflow-hidden relative">
      {/* Main Content Area (Independent scroll pane) */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto transition-all duration-300">
        <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 py-6 pb-24">
          {children}
        </div>
      </main>

      {/* AI Assistant Sidebar (Independent scroll pane on desktop, Fullscreen on mobile) */}
      <AIChatSidebar isOpen={isOpen} onClose={closeAssistant} />
    </div>
  );
}

"use client";

import React from "react";
import { useAIAssistant } from "@/components/ai/AIAssistantContext";
import { AIChatSidebar } from "@/components/ai/AIChatSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, closeAssistant } = useAIAssistant();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 items-start min-h-[calc(100vh-4rem)]">
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-3 sm:px-6 py-4 pb-20 transition-all duration-300">
        {children}
      </main>

      {/* AI Assistant Sidebar (In-flow on desktop, Fullscreen on mobile) */}
      <AIChatSidebar isOpen={isOpen} onClose={closeAssistant} />
    </div>
  );
}

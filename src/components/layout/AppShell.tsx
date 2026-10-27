"use client";

import React from "react";
import { useAIAssistant } from "@/components/ai/AIAssistantContext";
import { AIChatSidebar } from "@/components/ai/AIChatSidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen, closeAssistant } = useAIAssistant();

  return (
    <div className="flex w-full flex-1 items-start min-h-[calc(100vh-4rem)] relative">
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 transition-all duration-300 flex justify-center py-4 px-3 sm:px-6 pb-20">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </main>

      {/* AI Assistant Sidebar (Sticky on right edge of desktop, Fullscreen on mobile) */}
      <AIChatSidebar isOpen={isOpen} onClose={closeAssistant} />
    </div>
  );
}

"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { useAIAssistant } from "./AIAssistantContext";

export function AIAssistantTrigger() {
  const { isOpen, openAssistant } = useAIAssistant();

  if (isOpen) return null;

  return (
    <aside aria-label="AI Assistant Quick Access">
      <button
        type="button"
        onClick={openAssistant}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/95 px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg backdrop-blur-md transition-all hover:scale-105 hover:bg-primary hover:shadow-xl active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        title="Відкрити AI Щоденник">
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">AI Асистент</span>
      </button>
    </aside>
  );
}

"use client";

import React, { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";

interface AIThoughtBlockProps {
  content: string;
}

export function AIThoughtBlock({ content }: AIThoughtBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const clean = content.replace(/<think>|<\/think>/g, "").trim();
  if (!clean) return null;

  return (
    <div className="w-full my-1 rounded-xl border border-border/60 bg-muted/20 overflow-hidden text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-left text-xs font-medium cursor-pointer">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary/70" />
          <span>Хід думок асистента</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-3 py-2 border-t border-border/30 bg-background/50 font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto">
          {clean}
        </div>
      )}
    </div>
  );
}

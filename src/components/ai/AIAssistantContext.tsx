"use client";

import React, { createContext, useContext, useState } from "react";

interface AIAssistantContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  openAssistant: () => void;
  closeAssistant: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const openAssistant = () => setIsOpen(true);
  const closeAssistant = () => setIsOpen(false);

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        openAssistant,
        closeAssistant,
      }}>
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider");
  }
  return context;
}

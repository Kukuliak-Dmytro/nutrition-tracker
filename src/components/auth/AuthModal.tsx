"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthCard } from "./AuthCard";

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onOpenChange,
  initialMode = "login",
}: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 border-none bg-transparent shadow-none">
        <AuthCard
          initialMode={initialMode}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

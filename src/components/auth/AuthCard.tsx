"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useLogin, useRegister } from "@/app/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { DvkLogo } from "@/components/ui/dvk-logo";

interface AuthCardProps {
  initialMode?: "login" | "register";
  onSuccess?: () => void;
}

export function AuthCard({ initialMode = "login", onSuccess }: AuthCardProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = useTranslations("auth");
  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      return;
    }

    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({ email: email.trim(), password });
      } else {
        await registerMutation.mutateAsync({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
        });
      }
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else if (typeof err === "object" && err !== null && "error" in err) {
        setErrorMessage(String((err as { error: unknown }).error));
      } else {
        setErrorMessage(t("errorOccurred"));
      }
    }
  };

  return (
    <Card className="w-full sm:w-[420px] max-w-[420px] mx-auto border-border/70 shadow-lg rounded-2xl bg-card/95 backdrop-blur-sm">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="flex justify-center mb-1">
          <DvkLogo className="h-9 w-auto" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          {mode === "login" ? t("loginTitle") : t("registerTitle")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground px-4">
          {t("subtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Segmented Mode Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-muted/60 border border-border/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === "login"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {t("signIn")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === "register"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {t("signUp")}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name" className="text-xs font-medium text-foreground">
                {t("name")}
              </Label>
              <Input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                disabled={isLoading}
                className="h-10 rounded-xl"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-email" className="text-xs font-medium text-foreground">
              {t("email")}
            </Label>
            <Input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              disabled={isLoading}
              autoComplete="email"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auth-password" className="text-xs font-medium text-foreground">
              {t("password")}
            </Label>
            <Input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              disabled={isLoading}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="h-10 rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-xl font-semibold mt-2 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("common.loading", { defaultValue: "Завантаження..." })}</span>
              </span>
            ) : mode === "login" ? (
              t("loginBtn")
            ) : (
              t("registerBtn")
            )}
          </Button>
        </form>

        {/* Toggle prompt */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setErrorMessage(null);
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors focus:outline-none">
            {mode === "login" ? t("needAccount") : t("haveAccount")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

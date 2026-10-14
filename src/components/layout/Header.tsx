"use client";
import { useState } from "react";
import {
  Flame,
  CalendarDays,
  Utensils,
  Apple,
  Target,
  Menu,
  X,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { ModeToggle } from "./ThemeSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDailyGoals } from "@/app/hooks/useGoals";
import { DailyGoalsModal } from "../dashboard/DailyGoalsModal";
import { useCurrentUser, useLogout } from "@/app/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const t = useTranslations("navigation");
  const tDash = useTranslations("dashboard");
  const tMeals = useTranslations("meals");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const { data: goals } = useDailyGoals();
  const { data: currentUser } = useCurrentUser();
  const logoutMutation = useLogout();

  const navLinks = [
    {
      href: "/",
      label: t("dashboard"),
      icon: CalendarDays,
      isActive: pathname === "/",
    },
    {
      href: "/recipes",
      label: t("recipes"),
      icon: Utensils,
      isActive: pathname.startsWith("/recipes"),
    },
    {
      href: "/ingredients",
      label: t("ingredients"),
      icon: Apple,
      isActive: pathname.startsWith("/ingredients"),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 1. Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] focus:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-500/25">
              <Flame className="h-5 w-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-foreground leading-tight">
                NutriTrack
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {t("caloriesAndMacros")}
              </span>
            </div>
          </Link>

          {/* 2. Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 border border-border/50">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    link.isActive
                      ? "bg-background text-primary shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 3. Right Utilities (Goals, Language, Theme, Auth) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Quick Goals Button (only if logged in) */}
            {currentUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGoalsModalOpen(true)}
                className="h-9 gap-1.5 rounded-xl text-xs font-medium border-border/70 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span>
                  {goals?.calories
                    ? t("quickGoals", {
                        calories: goals.calories,
                        maintenance: goals.maintenanceCalories || 2850,
                      })
                    : t("goals")}
                </span>
              </Button>
            )}

            <LanguageSwitcher />
            <ModeToggle />

            {/* Auth Button / Profile */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-border/60">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/50 text-xs font-medium text-foreground"
                  title={currentUser.email}>
                  <UserIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="max-w-[110px] truncate">
                    {currentUser.name || currentUser.email.split("@")[0]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive"
                  title={tAuth("logout")}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="h-9 gap-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs">
                <UserIcon className="h-3.5 w-3.5" />
                <span>{tAuth("signIn")}</span>
              </Button>
            )}
          </div>

          {/* 4. Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            {currentUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsGoalsModalOpen(true)}
                className="h-9 w-9 rounded-xl"
                aria-label={tDash("setupGoals")}>
                <Target className="h-4 w-4 text-primary" />
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="h-9 w-9 rounded-xl"
              aria-expanded={isMobileMenuOpen}
              aria-label="Menu">
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 5. Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-border/80 bg-background/95 backdrop-blur-lg px-4 pt-2 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      link.isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}>
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Auth Bar */}
            {currentUser ? (
              <div className="flex items-center justify-between px-1 pt-3 border-t border-border/50 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium truncate max-w-[200px]">
                  <UserIcon className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{currentUser.name || currentUser.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logoutMutation.mutate();
                  }}
                  disabled={logoutMutation.isPending}
                  className="text-xs text-destructive hover:bg-destructive/10 h-8 gap-1.5 rounded-lg">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{tAuth("logout")}</span>
                </Button>
              </div>
            ) : (
              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full h-9 gap-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>{tAuth("signIn")}</span>
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              {currentUser ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsGoalsModalOpen(true);
                  }}
                  className="h-9 gap-2 rounded-xl text-xs font-medium">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {t("goals")} ({goals?.calories ? `${goals.calories} ${tMeals("kcal")}` : tDash("setupGoals")})
                  </span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ModeToggle />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Goals Settings Modal */}
      <DailyGoalsModal
        isOpen={isGoalsModalOpen}
        onOpenChange={setIsGoalsModalOpen}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />
    </>
  );
}

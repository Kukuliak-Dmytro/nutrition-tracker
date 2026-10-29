"use client";
import { useFoodLogSummary } from "@/app/hooks/useFoodLog";
import { Flame, CalendarCheck, Target, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";

export function DashboardStatsBanner() {
  const t = useTranslations("dashboard");
  const tMeals = useTranslations("meals");
  const { data: summaryData } = useFoodLogSummary();

  const stats = summaryData?.stats || {
    totalLoggedDays: 0,
    cumulativeMaintenanceDeficit: 0,
    estimatedFatLossKg: 0,
    averageCalories: 0,
    deficitDays: 0,
    maintenanceDays: 0,
    surplusDays: 0,
  };

  const goals = summaryData?.goals || {
    calories: 2200,
    maintenanceCalories: 2850,
    goalType: "WEIGHT_LOSS" as const,
  };

  const isDeficitPositive = stats.cumulativeMaintenanceDeficit > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Cumulative Maintenance Deficit */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs transition-all hover:border-status-deficit/40">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {t("statsDeficit")}
          </span>
          <div className="w-8 h-8 rounded-xl bg-status-deficit/10 text-status-deficit flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-status-deficit">
            {isDeficitPositive ? "+" : ""}
            {stats.cumulativeMaintenanceDeficit.toLocaleString()}
          </span>
          <span className="text-xs font-normal text-muted-foreground">{tMeals("kcal")}</span>
        </div>
      </div>

      {/* 2. Days Tracked & Breakdown */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs transition-all hover:border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {t("statsDaysTracked")}
          </span>
          <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {stats.totalLoggedDays}
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {t("statsDaysConsecutive")}
          </span>
        </div>
      </div>

      {/* 3. Average Calories Intake */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs transition-all hover:border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {t("statsAvgCalories")}
          </span>
          <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {stats.averageCalories.toLocaleString()}
          </span>
          <span className="text-xs font-normal text-muted-foreground">{tMeals("kcal")}</span>
        </div>
      </div>

      {/* 4. Daily Target & Goal Strategy */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col justify-between shadow-xs transition-all hover:border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {t("dailyGoal")}
          </span>
          <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {(goals.calories || 2200).toLocaleString()}
          </span>
          <span className="text-xs font-normal text-muted-foreground">{tMeals("kcal")}</span>
        </div>
      </div>
    </div>
  );
}

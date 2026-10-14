"use client";
import { useFoodLogSummary } from "@/app/hooks/useFoodLog";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, CalendarCheck, Target, TrendingDown, Sparkles } from "lucide-react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Cumulative Maintenance Deficit */}
      <Card className="rounded-2xl border bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-sm overflow-hidden relative group hover:border-emerald-500/30 transition-all">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statsDeficit")}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {isDeficitPositive ? "+" : ""}
                {stats.cumulativeMaintenanceDeficit.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">{tMeals("kcal")}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 inline" />
              <span>{t("statsFatLoss", { kg: stats.estimatedFatLossKg })}</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Days Streak & Breakdown */}
      <Card className="rounded-2xl border bg-gradient-to-br from-card via-card to-blue-500/5 shadow-sm overflow-hidden relative group hover:border-blue-500/30 transition-all">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statsDaysTracked")}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight">
                {stats.totalLoggedDays}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {t("statsDaysConsecutive")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400">
                ● {stats.deficitDays} {t("statsDeficitDays")}
              </span>
              <span className="inline-flex items-center text-amber-600 dark:text-amber-400">
                ● {stats.maintenanceDays} {t("statsMaintDays")}
              </span>
              {stats.surplusDays > 0 && (
                <span className="inline-flex items-center text-rose-600 dark:text-rose-400">
                  ● {stats.surplusDays} {t("statsSurplusDays")}
                </span>
              )}
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 3. Average Calories Intake */}
      <Card className="rounded-2xl border bg-gradient-to-br from-card via-card to-amber-500/5 shadow-sm overflow-hidden relative group hover:border-amber-500/30 transition-all">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statsAvgCalories")}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight">
                {stats.averageCalories.toLocaleString()}
              </span>
              <span className="text-sm font-normal text-muted-foreground ml-1">{tMeals("kcal")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("goalCaloriesSummary", {
                target: goals.calories || 2200,
                maintenance: goals.maintenanceCalories || 2850,
              })}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Target & Maintenance Level with Strategy */}
      <Card className="rounded-2xl border bg-gradient-to-br from-card via-card to-purple-500/5 shadow-sm overflow-hidden relative group hover:border-purple-500/30 transition-all">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                goals.goalType === "MUSCLE_GAIN"
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                  : goals.goalType === "MAINTENANCE"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              }`}>
                {goals.goalType === "MUSCLE_GAIN"
                  ? t("goalMuscleGain")
                  : goals.goalType === "MAINTENANCE"
                  ? t("goalMaintenance")
                  : t("goalWeightLoss")}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">
                {t("statsStrategyTarget", { calories: goals.calories || 2200 })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("maintenanceShort", { maintenance: goals.maintenanceCalories || 2850 })}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

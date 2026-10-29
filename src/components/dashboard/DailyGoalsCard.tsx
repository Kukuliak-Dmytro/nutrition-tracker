"use client";
import { useState } from "react";
import { useDailyGoals } from "@/app/hooks/useGoals";
import { DailyGoalsModal } from "./DailyGoalsModal";
import { Button } from "@/components/ui/button";
import { Settings, Flame } from "lucide-react";
import { useTranslations } from "next-intl";

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function DailyGoalsCard({ totals }: { totals: Totals }) {
  const t = useTranslations("dashboard");
  const tMeals = useTranslations("meals");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: goals } = useDailyGoals();

  const targetCalories = goals?.calories ?? 2200;
  const maintenanceCalories = goals?.maintenanceCalories ?? 2850;
  const goalType = goals?.goalType ?? "WEIGHT_LOSS";
  const targetProtein = goals?.protein ?? 150;
  const targetFat = goals?.fat ?? 65;
  const targetCarbs = goals?.carbs ?? 230;
  const targetFiber = goals?.fiber ?? 30;

  const calPercent = Math.min(100, Math.round((totals.calories / targetCalories) * 100));
  const proPercent = Math.min(100, Math.round((totals.protein / targetProtein) * 100));
  const fatPercent = Math.min(100, Math.round((totals.fat / targetFat) * 100));
  const carbPercent = Math.min(100, Math.round((totals.carbs / targetCarbs) * 100));
  const fibPercent = Math.min(100, Math.round((totals.fiber / targetFiber) * 100));

  const calRemaining = targetCalories - totals.calories;
  const maintRemaining = maintenanceCalories - totals.calories;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-calories/10 text-calories">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">{t("dailyProgress")}</h2>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                goalType === "WEIGHT_LOSS"
                  ? "bg-status-deficit/10 border-status-deficit/30 text-status-deficit"
                  : goalType === "MUSCLE_GAIN"
                  ? "bg-protein/10 border-protein/30 text-protein"
                  : "bg-muted border-border text-muted-foreground"
              }`}>
                {goalType === "WEIGHT_LOSS"
                  ? t("goalWeightLoss")
                  : goalType === "MUSCLE_GAIN"
                  ? t("goalMuscleGain")
                  : t("goalMaintenance")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("goalCaloriesSummary", { target: targetCalories, maintenance: maintenanceCalories })}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs rounded-xl h-9 self-start sm:self-center">
          <Settings className="w-3.5 h-3.5" />
          {t("setupGoals")}
        </Button>
      </div>

      {/* Main Calories Progress with Target & Maintenance indicators */}
      <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/60">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">{t("calories")}</span>
            <span className="text-xs text-muted-foreground">
              ({t("caloriesCount", { calories: totals.calories.toFixed(0), target: targetCalories })})
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-muted-foreground">
              {t("maintenanceShort", { maintenance: maintenanceCalories })}
            </span>
            <span className="font-bold text-calories text-base">
              {calPercent}%
            </span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="bg-calories h-full rounded-full transition-all duration-500"
            style={{ width: `${calPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground pt-0.5">
          <span>
            {calRemaining >= 0
              ? t("remainingToTarget", { calories: calRemaining.toFixed(0) })
              : t("overTarget", { calories: Math.abs(calRemaining).toFixed(0) })}
          </span>
          <span className="font-medium text-foreground">
            {maintRemaining >= 0
              ? t("deficitToMaintenance", { calories: maintRemaining.toFixed(0) })
              : t("surplusToMaintenance", { calories: Math.abs(maintRemaining).toFixed(0) })}
          </span>
        </div>
      </div>

      {/* Macros Grid (Protein, Fat, Carbs, Fiber) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Protein */}
        <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-protein" />
              {t("protein")}
            </span>
            <span className="text-muted-foreground font-medium">{proPercent}%</span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {totals.protein.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ {targetProtein}{tMeals("grams")}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-protein h-full rounded-full transition-all duration-500"
              style={{ width: `${proPercent}%` }}
            />
          </div>
        </div>

        {/* Fat */}
        <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              {t("fat")}
            </span>
            <span className="text-muted-foreground font-medium">{fatPercent}%</span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {totals.fat.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ {targetFat}{tMeals("grams")}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-muted-foreground/60 h-full rounded-full transition-all duration-500"
              style={{ width: `${fatPercent}%` }}
            />
          </div>
        </div>

        {/* Carbs */}
        <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              {t("carbs")}
            </span>
            <span className="text-muted-foreground font-medium">{carbPercent}%</span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {totals.carbs.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ {targetCarbs}{tMeals("grams")}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-muted-foreground/60 h-full rounded-full transition-all duration-500"
              style={{ width: `${carbPercent}%` }}
            />
          </div>
        </div>

        {/* Fiber */}
        <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
              {t("fiber")}
            </span>
            <span className="text-muted-foreground font-medium">{fibPercent}%</span>
          </div>
          <div className="text-lg font-bold text-foreground">
            {totals.fiber.toFixed(1)} <span className="text-xs font-normal text-muted-foreground">/ {targetFiber}{tMeals("grams")}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-muted-foreground/40 h-full rounded-full transition-all duration-500"
              style={{ width: `${fibPercent}%` }}
            />
          </div>
        </div>
      </div>

      <DailyGoalsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

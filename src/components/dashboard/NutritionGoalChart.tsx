"use client";
import { useState, useEffect } from "react";
import { useFoodLogSummary } from "@/app/hooks/useFoodLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { Activity, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface MetricConfig {
  key: "caloriesPct" | "proteinPct" | "fiberPct" | "carbsPct" | "fatPct";
  rawKey: "calories" | "protein" | "fiber" | "carbs" | "fat";
  color: string;
  goalKey: "calories" | "protein" | "fiber" | "carbs" | "fat";
}

const METRICS: MetricConfig[] = [
  {
    key: "caloriesPct",
    rawKey: "calories",
    color: "#f97316", // orange-500
    goalKey: "calories",
  },
  {
    key: "proteinPct",
    rawKey: "protein",
    color: "#8b5cf6", // purple-500
    goalKey: "protein",
  },
  {
    key: "fiberPct",
    rawKey: "fiber",
    color: "#10b981", // emerald-500
    goalKey: "fiber",
  },
  {
    key: "carbsPct",
    rawKey: "carbs",
    color: "#3b82f6", // blue-500
    goalKey: "carbs",
  },
  {
    key: "fatPct",
    rawKey: "fat",
    color: "#ec4899", // pink-500
    goalKey: "fat",
  },
];

interface NutritionGoalChartProps {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

interface ChartClickEvent {
  activePayload?: Array<{
    payload?: {
      date?: string;
    };
  }>;
}

export function NutritionGoalChart({
  selectedDate,
  onSelectDate,
}: NutritionGoalChartProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tMeals = useTranslations("meals");
  const dateLocale = locale === "en" ? enUS : uk;

  const getMetricLabel = (key: string) => {
    switch (key) {
      case "caloriesPct":
        return t("calories");
      case "proteinPct":
        return t("protein");
      case "fiberPct":
        return t("fiber");
      case "carbsPct":
        return t("carbs");
      case "fatPct":
        return t("fat");
      default:
        return key;
    }
  };

  const getMetricUnit = (key: string) => {
    return key === "caloriesPct" ? tMeals("kcal") : tMeals("grams");
  };

  const [mounted, setMounted] = useState(false);
  const { data: summaryData } = useFoodLogSummary();

  const selectedDisplayDate = format(selectedDate, "dd.MM");

  // Selected checkboxes: default calories, protein, fiber
  const [activeMetrics, setActiveMetrics] = useState<string[]>([
    "caloriesPct",
    "proteinPct",
    "fiberPct",
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => {
      if (prev.includes(key)) {
        // Prevent deselecting everything: keep at least 1
        if (prev.length <= 1) return prev;
        return prev.filter((m) => m !== key);
      }
      return [...prev, key];
    });
  };

  const days = summaryData?.days || [];
  const goals = summaryData?.goals || {
    calories: 2200,
    maintenanceCalories: 2850,
    protein: 150,
    carbs: 230,
    fat: 65,
    fiber: 30,
    maintenancePct: 129.5,
  };

  // Format data for Recharts
  const chartData = days.map((day) => {
    let formattedDate = day.date;
    try {
      formattedDate = format(parseISO(day.date), "dd.MM");
    } catch {
      // fallback
    }

    return {
      date: day.date,
      displayDate: formattedDate,
      caloriesPct: day.caloriesPct,
      proteinPct: day.proteinPct,
      carbsPct: day.carbsPct,
      fatPct: day.fatPct,
      fiberPct: day.fiberPct,
      // Raw values for tooltip
      calories: day.calories,
      protein: day.protein,
      carbs: day.carbs,
      fat: day.fat,
      fiber: day.fiber,
      status: day.status,
    };
  });

  return (
    <Card className="rounded-2xl border shadow-sm bg-card overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                {t("chartTitle")}
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-0.5 bg-emerald-500 inline-block" />
                {t("chartTargetLabel", { calories: goals.calories })}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
                {t("chartMaintenanceLabel", {
                  maintenance: goals.maintenanceCalories,
                  percent: goals.maintenancePct,
                })}
              </span>
            </div>
          </div>

          {/* Metric Checkboxes */}
          <div className="flex flex-wrap items-center gap-1.5">
            {METRICS.map((metric) => {
              const isChecked = activeMetrics.includes(metric.key);
              return (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => toggleMetric(metric.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all border ${
                    isChecked
                      ? "bg-card shadow-sm border-foreground/20 text-foreground"
                      : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60"
                  }`}>
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                      isChecked
                        ? "text-white"
                        : "border-muted-foreground/40 bg-transparent"
                    }`}
                    style={{
                      backgroundColor: isChecked ? metric.color : "transparent",
                      borderColor: isChecked ? metric.color : undefined,
                    }}>
                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span>{getMetricLabel(metric.key)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-4">
        {!mounted ? (
          <div className="h-[280px] w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center text-xs text-muted-foreground">
            {t("chartLoading")}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] w-full flex items-center justify-center text-xs text-muted-foreground">
            {t("chartNoData")}
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 24, left: -10, bottom: 0 }}
                onClick={(e: unknown) => {
                  const evt = e as ChartClickEvent | undefined;
                  if (evt?.activePayload?.[0]?.payload?.date) {
                    const clickedDateStr = evt.activePayload[0].payload.date;
                    const [y, m, d] = clickedDateStr.split("-").map(Number);
                    onSelectDate(new Date(y, m - 1, d));
                  }
                }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="text-border/40"
                />

                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                  domain={[
                    0,
                    (dataMax: number) =>
                      Math.max(
                        Math.ceil((goals.maintenancePct + 15) / 20) * 20,
                        Math.ceil((dataMax + 10) / 20) * 20
                      ),
                  ]}
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />

                {/* 1. Target Reference Line (100%) */}
                <ReferenceLine
                  y={100}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value:
                      Math.abs(goals.maintenancePct - 100) <= 1
                        ? t("chartTargetAndMaint", { calories: goals.calories })
                        : t("chartTargetOnly", { calories: goals.calories }),
                    position: "insideTopRight",
                    fill: "#10b981",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                {/* 2. Maintenance Reference Line */}
                {goals.maintenancePct > 0 &&
                  Math.abs(goals.maintenancePct - 100) > 1 && (
                    <ReferenceLine
                      y={goals.maintenancePct}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: t("chartMaintOnly", {
                          maintenance: goals.maintenanceCalories,
                          percent: goals.maintenancePct,
                        }),
                        position: "insideTopRight",
                        fill: "#f59e0b",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                  )}

                {/* Selected Date Indicator Line */}
                <ReferenceLine
                  x={selectedDisplayDate}
                  stroke="currentColor"
                  strokeOpacity={0.3}
                  strokeDasharray="2 2"
                  strokeWidth={1.5}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload;
                    let fullDateText = data.date;
                    try {
                      fullDateText = format(parseISO(data.date), "d MMMM yyyy (EEEE)", {
                        locale: dateLocale,
                      });
                    } catch {}

                    return (
                      <div className="rounded-xl border bg-card/95 backdrop-blur-sm p-3 shadow-lg text-xs space-y-2 min-w-[200px]">
                        <div className="font-semibold text-foreground border-b pb-1">
                          {fullDateText}
                        </div>
                        <div className="space-y-1">
                          {METRICS.filter((m) => activeMetrics.includes(m.key)).map((m) => {
                            const pct = data[m.key];
                            const raw = data[m.rawKey];
                            const goalVal = goals[m.goalKey];

                            return (
                              <div
                                key={m.key}
                                className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: m.color }}
                                  />
                                  <span>{getMetricLabel(m.key)}:</span>
                                </span>
                                <span className="font-semibold">
                                  {pct}%{" "}
                                  <span className="text-muted-foreground font-normal">
                                    ({raw} / {goalVal} {getMetricUnit(m.key)})
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {data.calories !== undefined && (
                          <div className="pt-1.5 mt-1 border-t border-border/50 text-[11px] space-y-1">
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span>{t("chartToMaintenance", { maintenance: goals.maintenanceCalories })}</span>
                              <span className={goals.maintenanceCalories - data.calories >= 0 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-500 font-semibold"}>
                                {goals.maintenanceCalories - data.calories >= 0 ? "+" : ""}
                                {(goals.maintenanceCalories - data.calories).toFixed(1)} {tMeals("kcal")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-muted-foreground">
                              <span>{t("chartToTarget", { calories: goals.calories })}</span>
                              <span className="font-semibold text-foreground">
                                {goals.calories - data.calories >= 0 ? "+" : ""}
                                {(goals.calories - data.calories).toFixed(1)} {tMeals("kcal")}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground pt-1 border-t italic">
                          {t("chartClickHint")}
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Render a Line for each active metric */}
                {METRICS.map((metric) => {
                  if (!activeMetrics.includes(metric.key)) return null;
                  return (
                    <Line
                      key={metric.key}
                      type="monotone"
                      dataKey={metric.key}
                      name={getMetricLabel(metric.key)}
                      stroke={metric.color}
                      strokeWidth={2.5}
                      dot={{
                        r: 4,
                        strokeWidth: 2,
                        fill: "#fff",
                        stroke: metric.color,
                      }}
                      activeDot={{
                        r: 6,
                        strokeWidth: 2,
                        fill: metric.color,
                        stroke: "#fff",
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

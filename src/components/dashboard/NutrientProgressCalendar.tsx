"use client";
import { useState } from "react";
import { useFoodLogSummary } from "@/app/hooks/useFoodLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";

interface NutrientProgressCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function NutrientProgressCalendar({
  selectedDate,
  onSelectDate,
}: NutrientProgressCalendarProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tMeals = useTranslations("meals");
  const dateLocale = locale === "en" ? enUS : uk;

  // Current viewing month
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());
  const { data: summaryData } = useFoodLogSummary();

  const daysData = summaryData?.days || [];
  const daysMap = new Map(daysData.map((d) => [d.date, d]));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  // Monday start for European week: weekStartsOn: 1
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const allCalendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const handleCurrentMonth = () => setCurrentMonth(new Date());

  const radius = 18;
  const circumference = 2 * Math.PI * radius; // ~113.1

  const weekDayNames =
    locale === "en"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

  return (
    <Card className="rounded-2xl border shadow-sm bg-card overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold capitalize">
                {format(currentMonth, "LLLL yyyy", { locale: dateLocale })}
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrentMonth}
              className="text-xs h-8 px-2.5 rounded-lg text-muted-foreground hover:text-foreground">
              {t("today")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="h-8 w-8 rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-8 w-8 rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDayNames.map((dayName, idx) => (
            <div
              key={idx}
              className={`text-xs font-semibold py-1 ${
                idx >= 5 ? "text-rose-500/70 dark:text-rose-400/70" : "text-muted-foreground"
              }`}>
              {dayName}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
          {allCalendarDays.map((dayDate) => {
            const dateStr = format(dayDate, "yyyy-MM-dd");
            const log = daysMap.get(dateStr);
            const isSelected = isSameDay(dayDate, selectedDate);
            const isCurMonth = isSameMonth(dayDate, currentMonth);
            const today = isToday(dayDate);

            // Ring calculations
            let ringColor = "";
            let ringProgress = 0;
            let statusTooltip = "";

            if (log) {
              // Percentage of target calories (capped at 100 for SVG ring)
              ringProgress = Math.min(100, Math.max(5, log.caloriesPct));

              if (log.status === "DEFICIT") {
                ringColor = "var(--accent)";
                statusTooltip = `🟢 ${t("calendarDeficit")}: ${log.calories} ${tMeals("kcal")} (${t("statsDeficit")}: +${log.deficitVsMaintenance} ${tMeals("kcal")})`;
              } else if (log.status === "MAINTENANCE") {
                ringColor = "var(--warning)";
                statusTooltip = `🟡 ${t("calendarMaintenance")}: ${log.calories} ${tMeals("kcal")} (${log.deficitVsMaintenance >= 0 ? "+" : ""}${log.deficitVsMaintenance} ${tMeals("kcal")})`;
              } else {
                ringColor = "var(--destructive)";
                statusTooltip = `🔴 ${t("calendarSurplus")}: ${log.calories} ${tMeals("kcal")}`;
              }
            }

            const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dayDate)}
                title={
                  log
                    ? `${format(dayDate, "d MMMM", { locale: dateLocale })}: ${statusTooltip}`
                    : `${format(dayDate, "d MMMM", { locale: dateLocale })}: ${t("calendarNoData")}`
                }
                className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  !isCurMonth ? "opacity-30" : "opacity-100"
                } ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10"
                    : "hover:scale-105"
                }`}>
                {/* SVG Progress Ring */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 44 44">
                  {/* Track circle */}
                  <circle
                    cx="22"
                    cy="22"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={
                      log
                        ? "text-muted/40"
                        : "text-muted/15"
                    }
                  />

                  {/* Colored progress ring */}
                  {log && ringProgress > 0 && (
                    <circle
                      cx="22"
                      cy="22"
                      r={radius}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="3"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 22 22)"
                      className="transition-all duration-500"
                    />
                  )}
                </svg>

                {/* Day Number in Center */}
                <div
                  className={`relative z-10 flex flex-col items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : today
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground group-hover:bg-muted/50"
                  }`}>
                  <span>{format(dayDate, "d")}</span>
                  {today && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-primary -mt-0.5" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{t("calendarDeficit")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>{t("calendarMaintenance")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span>{t("calendarSurplus")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";
import { useState } from "react";
import { useFoodLog } from "@/app/hooks/useFoodLog";
import { DailyGoalsCard } from "./DailyGoalsCard";
import { MealSection } from "./MealSection";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Coffee,
  Sun,
  Apple,
  Moon,
  Cookie,
  Utensils,
} from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

interface DailyFoodDiaryProps {
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
}

export function DailyFoodDiary({
  selectedDate: controlledDate,
  onSelectDate: setControlledDate,
}: DailyFoodDiaryProps = {}) {
  const locale = useLocale();
  const tDashboard = useTranslations("dashboard");
  const tMeals = useTranslations("meals");
  const dateLocale = locale === "en" ? enUS : uk;

  const [internalDate, setInternalDate] = useState<Date>(new Date());
  const selectedDate = controlledDate ?? internalDate;
  const setSelectedDate = (val: Date | ((prev: Date) => Date)) => {
    const nextDate = typeof val === "function" ? val(selectedDate) : val;
    if (setControlledDate) {
      setControlledDate(nextDate);
    } else {
      setInternalDate(nextDate);
    }
  };
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: foodLogData } = useFoodLog(dateStr);

  const totals = foodLogData?.totals || {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  };

  const entries = foodLogData?.entries || [];

  const breakfastEntries = entries.filter((e) => e.mealType === "BREAKFAST");
  const snack1Entries = entries.filter((e) => e.mealType === "SNACK_1");
  const lunchEntries = entries.filter((e) => e.mealType === "LUNCH");
  const snack2Entries = entries.filter((e) => e.mealType === "SNACK_2");
  const dinnerEntries = entries.filter((e) => e.mealType === "DINNER");

  const handlePrevDay = () => setSelectedDate((prev) => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  const formattedDateTitle = isToday(selectedDate)
    ? `${tDashboard("today")}, ${format(selectedDate, "d MMMM yyyy", { locale: dateLocale })}`
    : format(selectedDate, "EEEE, d MMMM yyyy", { locale: dateLocale });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            className="h-9 w-9 rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border font-semibold text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="capitalize">{formattedDateTitle}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            className="h-9 w-9 rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>

          {!isToday(selectedDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToday}
              className="text-xs h-9">
              {tDashboard("today")}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/recipes">
            <Button variant="outline" size="sm" className="text-xs rounded-xl h-9">
              <Utensils className="w-3.5 h-3.5 mr-1.5" />
              {tDashboard("currentDishesBtn")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Nutrition & Goals Progress Bar */}
      <DailyGoalsCard totals={totals} />

      {/* 5 Meal Sections */}
      <div className="space-y-4">
        {/* 1. Сніданок */}
        <MealSection
          mealType="BREAKFAST"
          title={tMeals("breakfast")}
          icon={<Coffee className="w-5 h-5 text-amber-600" />}
          date={dateStr}
          entries={breakfastEntries}
        />

        {/* 2. Перший перекус */}
        <MealSection
          mealType="SNACK_1"
          title={tMeals("snack1")}
          icon={<Apple className="w-5 h-5 text-emerald-600" />}
          date={dateStr}
          entries={snack1Entries}
        />

        {/* 3. Обід */}
        <MealSection
          mealType="LUNCH"
          title={tMeals("lunch")}
          icon={<Sun className="w-5 h-5 text-orange-600" />}
          date={dateStr}
          entries={lunchEntries}
        />

        {/* 4. Другий перекус */}
        <MealSection
          mealType="SNACK_2"
          title={tMeals("snack2")}
          icon={<Cookie className="w-5 h-5 text-purple-600" />}
          date={dateStr}
          entries={snack2Entries}
        />

        {/* 5. Вечеря */}
        <MealSection
          mealType="DINNER"
          title={tMeals("dinner")}
          icon={<Moon className="w-5 h-5 text-indigo-600" />}
          date={dateStr}
          entries={dinnerEntries}
        />
      </div>
    </div>
  );
}

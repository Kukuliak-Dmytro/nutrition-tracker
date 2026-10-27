"use client";
import { useState } from "react";
import { DashboardStatsBanner } from "./DashboardStatsBanner";
import { NutrientProgressCalendar } from "./NutrientProgressCalendar";
import { NutritionGoalChart } from "./NutritionGoalChart";
import { DailyFoodDiary } from "./DailyFoodDiary";
import { useCurrentUser } from "@/app/hooks/useAuth";
import { AuthCard } from "@/components/auth/AuthCard";
import { Loader2 } from "lucide-react";

export default function DashboardClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[75vh] px-4 py-8 animate-in fade-in duration-300">
        <AuthCard />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-8 my-2 animate-in fade-in duration-300">
      {/* 1. Overall Tracking & Deficit Summary Banner */}
      <DashboardStatsBanner />

      {/* 2. Interactive Analytics: Calendar and Multi-metric Goal Chart stacked vertically */}
      <div className="flex flex-col gap-6 w-full">
        {/* Calendar: full width stacked on top */}
        <NutrientProgressCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Goal Percentage Chart: full width stacked below */}
        <NutritionGoalChart
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* 3. Detailed Food Diary for the Selected Date */}
      <div className="w-full pt-2">
        <DailyFoodDiary
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </div>
    </div>
  );
}

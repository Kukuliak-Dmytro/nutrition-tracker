"use client";
import { useState } from "react";
import { DashboardStatsBanner } from "./DashboardStatsBanner";
import { NutrientProgressCalendar } from "./NutrientProgressCalendar";
import { NutritionGoalChart } from "./NutritionGoalChart";
import { DailyFoodDiary } from "./DailyFoodDiary";

export default function DashboardClient() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="flex flex-col w-full gap-8 my-4 max-w-7xl mx-auto px-2 sm:px-4">
      {/* 1. Overall Tracking & Deficit Summary Banner */}
      <DashboardStatsBanner />

      {/* 2. Interactive Analytics: Calendar with Progress Rings & Multi-metric Goal Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar: 5 cols on desktop */}
        <div className="lg:col-span-5 w-full">
          <NutrientProgressCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Goal Percentage Chart: 7 cols on desktop */}
        <div className="lg:col-span-7 w-full">
          <NutritionGoalChart
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
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

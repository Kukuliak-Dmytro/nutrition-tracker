import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../utils/prisma/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({
        periodTotals: { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0, daysTracked: 0 },
        dailyStats: [],
        deficitTrend: { totalDeficit: 0, totalSurplus: 0, netDeficit: 0, estimatedFatChangeKg: 0, maintenanceCalories: 2850 },
        targetComparison: { targetCalories: 2200, targetProtein: 150, targetCarbs: 230, targetFat: 65, targetFiber: 30 },
      });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const whereClause: Record<string, unknown> = { userId };
    if (startDateParam || endDateParam) {
      const dateFilter: Record<string, Date> = {};
      if (startDateParam) {
        const [sy, sm, sd] = startDateParam.split("-").map(Number);
        dateFilter.gte = new Date(Date.UTC(sy, sm - 1, sd));
      }
      if (endDateParam) {
        const [ey, em, ed] = endDateParam.split("-").map(Number);
        dateFilter.lte = new Date(Date.UTC(ey, em - 1, ed));
      }
      whereClause.date = dateFilter;
    }

    // 1. Fetch Goals
    let goal = await prisma.dailyGoal.findUnique({
      where: { userId },
    });
    if (!goal) {
      goal = await prisma.dailyGoal.findFirst({
        where: { userId: null },
      });
    }

    const targetCalories = Number(goal?.calories ?? 2200);
    const maintenanceCalories = Number(goal?.maintenanceCalories ?? 2850);
    const targetProtein = Number(goal?.protein ?? 150);
    const targetCarbs = Number(goal?.carbs ?? 230);
    const targetFat = Number(goal?.fat ?? 65);
    const targetFiber = Number(goal?.fiber ?? 30);

    // 2. Fetch all entries in range
    const entries = await prisma.foodLogEntry.findMany({
      where: whereClause,
      orderBy: { date: "asc" },
    });

    // 3. Group by date YYYY-MM-DD
    const byDateMap = new Map<
      string,
      {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      }
    >();

    for (const entry of entries) {
      const dateStr = entry.date.toISOString().split("T")[0];
      const current = byDateMap.get(dateStr) || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };

      current.calories += Number(entry.calories);
      current.protein += Number(entry.protein);
      current.carbs += Number(entry.carbs);
      current.fat += Number(entry.fat);
      current.fiber += Number(entry.fiber);

      byDateMap.set(dateStr, current);
    }

    // 4. Calculate stats per day
    const dailyStats = Array.from(byDateMap.entries()).map(([date, totals]) => {
      const calories = Math.round(totals.calories * 10) / 10;
      const protein = Math.round(totals.protein * 10) / 10;
      const carbs = Math.round(totals.carbs * 10) / 10;
      const fat = Math.round(totals.fat * 10) / 10;
      const fiber = Math.round(totals.fiber * 10) / 10;

      const deficitVsMaintenance = maintenanceCalories - calories;
      const diffVsTarget = calories - targetCalories;

      return {
        date,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        maintenanceCalories,
        targetCalories,
        deficitVsMaintenance,
        diffVsTarget,
        isUnderTarget: calories <= targetCalories,
        isDeficit: deficitVsMaintenance > 0,
      };
    });

    // 5. Total aggregations
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalDeficit = 0;
    let totalSurplus = 0;

    for (const day of dailyStats) {
      totalCalories += day.calories;
      totalProtein += day.protein;
      totalCarbs += day.carbs;
      totalFat += day.fat;
      totalFiber += day.fiber;

      if (day.deficitVsMaintenance > 0) {
        totalDeficit += day.deficitVsMaintenance;
      } else {
        totalSurplus += Math.abs(day.deficitVsMaintenance);
      }
    }

    const daysTracked = dailyStats.length;
    const netDeficit = totalDeficit - totalSurplus;
    const estimatedFatChangeKg = Math.round((netDeficit / 7700) * 100) / 100;

    return NextResponse.json({
      periodTotals: {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        totalFiber: Math.round(totalFiber),
        daysTracked,
        avgDailyCalories: daysTracked ? Math.round(totalCalories / daysTracked) : 0,
        avgDailyProtein: daysTracked ? Math.round((totalProtein / daysTracked) * 10) / 10 : 0,
        avgDailyCarbs: daysTracked ? Math.round((totalCarbs / daysTracked) * 10) / 10 : 0,
        avgDailyFat: daysTracked ? Math.round((totalFat / daysTracked) * 10) / 10 : 0,
        avgDailyFiber: daysTracked ? Math.round((totalFiber / daysTracked) * 10) / 10 : 0,
      },
      dailyStats,
      deficitTrend: {
        totalDeficit: Math.round(totalDeficit),
        totalSurplus: Math.round(totalSurplus),
        netDeficit: Math.round(netDeficit),
        estimatedFatChangeKg,
        maintenanceCalories,
      },
      targetComparison: {
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        targetFiber,
      },
    });
  } catch (error) {
    console.error("Failed to fetch food log summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}

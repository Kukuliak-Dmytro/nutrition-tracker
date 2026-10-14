import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../utils/prisma/prisma";
import { getSessionUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const whereClause: Record<string, unknown> = userId
      ? { userId }
      : { userId: null };

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
    let goal = userId
      ? await prisma.dailyGoal.findUnique({
          where: { userId },
        })
      : null;

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
        entryCount: number;
      }
    >();

    for (const entry of entries) {
      const dateKey = entry.date.toISOString().split("T")[0];
      const existing = byDateMap.get(dateKey) || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        entryCount: 0,
      };

      existing.calories += Number(entry.calories);
      existing.protein += Number(entry.protein);
      existing.carbs += Number(entry.carbs);
      existing.fat += Number(entry.fat);
      existing.fiber += Number(entry.fiber);
      existing.entryCount += 1;

      byDateMap.set(dateKey, existing);
    }

    const days = Array.from(byDateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, vals]) => {
        const cal = Math.round(vals.calories * 10) / 10;
        const p = Math.round(vals.protein * 10) / 10;
        const c = Math.round(vals.carbs * 10) / 10;
        const f = Math.round(vals.fat * 10) / 10;
        const fib = Math.round(vals.fiber * 10) / 10;

        let status: "DEFICIT" | "MAINTENANCE" | "SURPLUS" = "DEFICIT";
        if (cal > maintenanceCalories) {
          status = "SURPLUS";
        } else if (cal > targetCalories) {
          status = "MAINTENANCE";
        }

        return {
          date: dateKey,
          calories: cal,
          protein: p,
          carbs: c,
          fat: f,
          fiber: fib,
          entryCount: vals.entryCount,
          status,
          caloriesPct:
            targetCalories > 0
              ? Math.round((cal / targetCalories) * 1000) / 10
              : 0,
          proteinPct:
            targetProtein > 0 ? Math.round((p / targetProtein) * 1000) / 10 : 0,
          carbsPct:
            targetCarbs > 0 ? Math.round((c / targetCarbs) * 1000) / 10 : 0,
          fatPct: targetFat > 0 ? Math.round((f / targetFat) * 1000) / 10 : 0,
          fiberPct:
            targetFiber > 0 ? Math.round((fib / targetFiber) * 1000) / 10 : 0,
          deficitVsTarget: Math.round((targetCalories - cal) * 10) / 10,
          deficitVsMaintenance: Math.round((maintenanceCalories - cal) * 10) / 10,
        };
      });

    // 4. Calculate cumulative stats
    let totalCals = 0;
    let totalMaintDeficit = 0;
    let deficitDays = 0;
    let maintenanceDays = 0;
    let surplusDays = 0;

    for (const d of days) {
      totalCals += d.calories;
      totalMaintDeficit += d.deficitVsMaintenance;
      if (d.status === "DEFICIT") deficitDays++;
      else if (d.status === "MAINTENANCE") maintenanceDays++;
      else surplusDays++;
    }

    const totalLoggedDays = days.length;
    const averageCalories =
      totalLoggedDays > 0 ? Math.round(totalCals / totalLoggedDays) : 0;
    const estimatedFatLossKg =
      Math.round((totalMaintDeficit / 7700) * 100) / 100;

    const goalsObj = {
      goalType: (goal?.goalType as "WEIGHT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE") || "WEIGHT_LOSS",
      calories: targetCalories,
      maintenanceCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat,
      fiber: targetFiber,
      maintenancePct:
        targetCalories > 0
          ? Math.round((maintenanceCalories / targetCalories) * 1000) / 10
          : 100,
    };

    const statsObj = {
      totalLoggedDays,
      cumulativeMaintenanceDeficit: Math.round(totalMaintDeficit),
      estimatedFatLossKg,
      averageCalories,
      deficitDays,
      maintenanceDays,
      surplusDays,
    };

    return NextResponse.json({
      days,
      goals: goalsObj,
      stats: statsObj,
    });
  } catch (error) {
    console.error("Failed to fetch food log summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch food log summary" },
      { status: 500 }
    );
  }
}

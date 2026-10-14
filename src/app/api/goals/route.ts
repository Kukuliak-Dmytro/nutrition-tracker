import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prisma/prisma";
import { DailyGoalSchema } from "../../../../utils/schemas/goals";
import { ZodError } from "zod";
import { getSessionUserId } from "@/lib/auth";

const DEFAULT_GOAL = {
  goalType: "WEIGHT_LOSS" as const,
  calories: 2200,
  maintenanceCalories: 2850,
  protein: 150,
  carbs: 230,
  fat: 65,
  fiber: 30,
};

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let goal = await prisma.dailyGoal.findUnique({
      where: { userId },
    });

    if (!goal) {
      // Check if there is an unassigned goal from pre-auth
      const unassignedGoal = await prisma.dailyGoal.findFirst({
        where: { userId: null },
      });

      if (unassignedGoal) {
        goal = await prisma.dailyGoal.update({
          where: { id: unassignedGoal.id },
          data: { userId },
        });
      } else {
        goal = await prisma.dailyGoal.create({
          data: {
            userId,
            ...DEFAULT_GOAL,
          },
        });
      }
    }

    return NextResponse.json({
      id: goal.id,
      goalType: goal.goalType ?? "WEIGHT_LOSS",
      calories: Number(goal.calories),
      maintenanceCalories: Number(goal.maintenanceCalories ?? 2850),
      protein: Number(goal.protein),
      carbs: Number(goal.carbs),
      fat: Number(goal.fat),
      fiber: Number(goal.fiber),
      updatedAt: goal.updatedAt,
    });
  } catch (error) {
    console.error("Failed to fetch daily goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily goal" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = DailyGoalSchema.parse(body);

    const goal = await prisma.dailyGoal.upsert({
      where: { userId },
      update: {
        goalType: validatedData.goalType,
        calories: validatedData.calories,
        maintenanceCalories: validatedData.maintenanceCalories ?? 2850,
        protein: validatedData.protein,
        carbs: validatedData.carbs,
        fat: validatedData.fat,
        fiber: validatedData.fiber,
      },
      create: {
        userId,
        goalType: validatedData.goalType,
        calories: validatedData.calories,
        maintenanceCalories: validatedData.maintenanceCalories ?? 2850,
        protein: validatedData.protein,
        carbs: validatedData.carbs,
        fat: validatedData.fat,
        fiber: validatedData.fiber,
      },
    });

    return NextResponse.json({
      id: goal.id,
      goalType: goal.goalType ?? "WEIGHT_LOSS",
      calories: Number(goal.calories),
      maintenanceCalories: Number(goal.maintenanceCalories ?? 2850),
      protein: Number(goal.protein),
      carbs: Number(goal.carbs),
      fat: Number(goal.fat),
      fiber: Number(goal.fiber),
      updatedAt: goal.updatedAt,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid goals data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update daily goal:", error);
    return NextResponse.json(
      { error: "Failed to update daily goal" },
      { status: 500 }
    );
  }
}

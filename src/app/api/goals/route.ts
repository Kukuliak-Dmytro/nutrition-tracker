import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prisma/prisma";
import { DailyGoalSchema } from "../../../../utils/schemas/goals";
import { ZodError } from "zod";

const DEFAULT_GOAL = {
  id: "default",
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
    let goal = await prisma.dailyGoal.findUnique({
      where: { id: "default" },
    });

    if (!goal) {
      goal = await prisma.dailyGoal.create({
        data: DEFAULT_GOAL,
      });
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
    const body = await req.json();
    const validatedData = DailyGoalSchema.parse(body);

    const goal = await prisma.dailyGoal.upsert({
      where: { id: "default" },
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
        id: "default",
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

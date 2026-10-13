import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../utils/prisma/prisma";
import { CreateFoodLogEntrySchema } from "../../../../utils/schemas/foodLog";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // e.g. "2026-10-13"

    let queryDate: Date;
    if (dateParam) {
      // Create date at midnight UTC
      const [year, month, day] = dateParam.split("-").map(Number);
      queryDate = new Date(Date.UTC(year, month - 1, day));
    } else {
      const now = new Date();
      queryDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const entries = await prisma.foodLogEntry.findMany({
      where: {
        date: queryDate,
      },
      include: {
        recipe: {
          select: {
             id: true,
             name: true,
             cookedWeightGrams: true,
             status: true,
          },
        },
        ingredient: {
          select: {
             id: true,
             name: true,
             category: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const totals = entries.reduce(
      (acc, entry) => ({
        calories: Math.round((acc.calories + Number(entry.calories)) * 10) / 10,
        protein: Math.round((acc.protein + Number(entry.protein)) * 10) / 10,
        carbs: Math.round((acc.carbs + Number(entry.carbs)) * 10) / 10,
        fat: Math.round((acc.fat + Number(entry.fat)) * 10) / 10,
        fiber: Math.round((acc.fiber + Number(entry.fiber)) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    return NextResponse.json({
      date: queryDate.toISOString().split("T")[0],
      entries,
      totals,
    });
  } catch (error) {
    console.error("Failed to fetch food log:", error);
    return NextResponse.json(
      { error: "Failed to fetch food log entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = CreateFoodLogEntrySchema.parse(body);

    const [year, month, day] = validatedData.date.includes("T")
      ? validatedData.date.split("T")[0].split("-").map(Number)
      : validatedData.date.split("-").map(Number);

    const entryDate = new Date(Date.UTC(year, month - 1, day));

    const entry = await prisma.foodLogEntry.create({
      data: {
        date: entryDate,
        mealType: validatedData.mealType,
        name: validatedData.name,
        recipeId: validatedData.recipeId || null,
        ingredientId: validatedData.ingredientId || null,
        weightGrams: validatedData.weightGrams ?? null,
        calories: validatedData.calories,
        protein: validatedData.protein,
        carbs: validatedData.carbs,
        fat: validatedData.fat,
        fiber: validatedData.fiber || 0,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            cookedWeightGrams: true,
            status: true,
          },
        },
        ingredient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid log entry data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to create food log entry:", error);
    return NextResponse.json(
      { error: "Failed to create food log entry" },
      { status: 500 }
    );
  }
}

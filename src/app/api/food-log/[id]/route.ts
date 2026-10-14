import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../utils/prisma/prisma";
import { UpdateFoodLogEntrySchema } from "../../../../../utils/schemas/foodLog";
import { ZodError } from "zod";
import { getSessionUserId } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = UpdateFoodLogEntrySchema.parse(body);

    const existing = await prisma.foodLogEntry.findUnique({
      where: { id },
    });

    if (!existing || (existing.userId && existing.userId !== userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const entry = await prisma.foodLogEntry.update({
      where: { id },
      data: {
        ...(validatedData.mealType && { mealType: validatedData.mealType }),
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.weightGrams !== undefined && {
          weightGrams: validatedData.weightGrams,
        }),
        ...(validatedData.calories !== undefined && {
          calories: validatedData.calories,
        }),
        ...(validatedData.protein !== undefined && {
          protein: validatedData.protein,
        }),
        ...(validatedData.carbs !== undefined && {
          carbs: validatedData.carbs,
        }),
        ...(validatedData.fat !== undefined && {
          fat: validatedData.fat,
        }),
        ...(validatedData.fiber !== undefined && {
          fiber: validatedData.fiber,
        }),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Failed to update food log entry:", error);
    return NextResponse.json(
      { error: "Failed to update food log entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.foodLogEntry.findUnique({
      where: { id },
    });

    if (!existing || (existing.userId && existing.userId !== userId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.foodLogEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete food log entry:", error);
    return NextResponse.json(
      { error: "Failed to delete food log entry" },
      { status: 500 }
    );
  }
}

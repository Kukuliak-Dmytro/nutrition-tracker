import prisma from "../../../../utils/prisma/prisma";
import {
  CreateIngredientSchema,
  IngredientQuerySchema,
} from "../../../../utils/schemas";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParams = IngredientQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );
    const userId = await getSessionUserId();
    const userFilter = userId
      ? { OR: [{ userId: null }, { userId }] }
      : { userId: null };

    const search = queryParams.search?.trim();
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const whereClause = {
      ...userFilter,
      ...where,
      ...(queryParams.minCalories !== undefined ||
      queryParams.maxCalories !== undefined
        ? {
            caloriesPer100g: {
              ...(queryParams.minCalories !== undefined && {
                gte: queryParams.minCalories,
              }),
              ...(queryParams.maxCalories !== undefined && {
                lte: queryParams.maxCalories,
              }),
            },
          }
        : {}),
      ...(queryParams.minProtein !== undefined ||
      queryParams.maxProtein !== undefined
        ? {
            proteinPer100g: {
              ...(queryParams.minProtein !== undefined && {
                gte: queryParams.minProtein,
              }),
              ...(queryParams.maxProtein !== undefined && {
                lte: queryParams.maxProtein,
              }),
            },
          }
        : {}),
      ...(queryParams.minCarbs !== undefined ||
      queryParams.maxCarbs !== undefined
        ? {
            carbsPer100g: {
              ...(queryParams.minCarbs !== undefined && {
                gte: queryParams.minCarbs,
              }),
              ...(queryParams.maxCarbs !== undefined && {
                lte: queryParams.maxCarbs,
              }),
            },
          }
        : {}),
      ...(queryParams.minFat !== undefined || queryParams.maxFat !== undefined
        ? {
            fatPer100g: {
              ...(queryParams.minFat !== undefined && {
                gte: queryParams.minFat,
              }),
              ...(queryParams.maxFat !== undefined && {
                lte: queryParams.maxFat,
              }),
            },
          }
        : {}),
    };

    const ingredients = await prisma.ingredient.findMany({
      where: whereClause,
      take: (queryParams.limit ?? 20) + 1,
      ...(queryParams.cursor && queryParams.cursor !== ""
        ? {
            cursor: {
              id: queryParams.cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy:
        queryParams.sortBy && queryParams.sortOrder
          ? {
              [queryParams.sortBy]: queryParams.sortOrder,
            }
          : {
              [queryParams.sortBy ?? "name"]: queryParams.sortOrder ?? "asc",
            },
    });
    const totalIngredients = await prisma.ingredient.count({ where: whereClause });
    const hasMore = ingredients.length > (queryParams.limit ?? 20);
    const data = hasMore ? ingredients.slice(0, queryParams.limit) : ingredients;
    const nextCursor =
      hasMore && data.length > 0 ? data[data.length - 1].id : null;

    return NextResponse.json({
      data,
      nextCursor,
      hasMore,
      totalIngredients,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid query parameters. Please check your search and filter values.", details: error.issues }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in error ? (error as { code?: string }).code : undefined;
    console.error("Failed to fetch ingredients:", errorMessage, errorCode, error);
    return NextResponse.json({ 
      error: "Unable to load ingredients. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    const body = await req.json();
    const validatedData = CreateIngredientSchema.parse(body);
    const ingredient = await prisma.ingredient.create({
      data: {
        userId: userId || null,
        name: validatedData.name,
        caloriesPer100g: validatedData.caloriesPer100g,
        proteinPer100g: validatedData.proteinPer100g,
        carbsPer100g: validatedData.carbsPer100g,
        fatPer100g: validatedData.fatPer100g,
        fiberPer100g: validatedData.fiberPer100g || 0,
        category: validatedData.category,
        isCustom: true,
      },
    });
    
    return NextResponse.json(ingredient);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid ingredient data. Please check all fields are filled correctly.", details: error.issues }, { status: 400 });
    }
    console.error("Failed to create ingredient:", error);
    return NextResponse.json(
      { error: "Unable to create ingredient. Please try again later." },
      { status: 500 }
    );
  }
}

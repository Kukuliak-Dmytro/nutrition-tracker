import { NextRequest, NextResponse } from "next/server";
import {
   GetRecipeSchema,
   UpdateRecipeSchema,
} from "../../../../../utils/schemas/recipe";
import prisma from "../../../../../utils/prisma/prisma";
import { ZodError } from "zod";

export async function GET(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const resolvedParams = await params;
      const { id } = GetRecipeSchema.parse(resolvedParams);
      const recipe = await prisma.recipe.findUnique({
         where: { id },
         include: {
            ingredients: {
               include: {
                  ingredient: {
                     select: {
                        id: true,
                        name: true,
                        caloriesPer100g: true,
                        proteinPer100g: true,
                        carbsPer100g: true,
                        fatPer100g: true,
                        fiberPer100g: true,
                        category: true,
                        isCustom: true,
                        createdAt: true,
                     },
                  },
               },
            },
         },
      });
      if (!recipe) {
         return NextResponse.json(
            { error: "Recipe not found" },
            { status: 404 }
         );
      }
      return NextResponse.json(recipe);
   } catch (error) {
      if (error instanceof ZodError) {
         return NextResponse.json(
            { error: "Invalid recipe ID", details: error.issues },
            { status: 400 }
         );
      }
      console.error("Failed to fetch recipe:", error);
      return NextResponse.json(
         { error: "Failed to fetch recipe" },
         { status: 500 }
      );
   }
}

export async function PATCH(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const resolvedParams = await params;
      const { id } = GetRecipeSchema.parse(resolvedParams);
      const body = await req.json();
      const validatedData = UpdateRecipeSchema.parse(body);

      const recipe = await prisma.recipe.update({
         where: { id },
         data: {
            ...(validatedData.name && { name: validatedData.name }),
            ...(validatedData.description !== undefined && {
               description: validatedData.description,
            }),
            ...(validatedData.servings && { servings: validatedData.servings }),
            ...(validatedData.cookingTime !== undefined && {
               cookingTime: validatedData.cookingTime,
            }),
            ...(validatedData.cookedWeightGrams !== undefined && {
               cookedWeightGrams: validatedData.cookedWeightGrams,
            }),
            ...(validatedData.status !== undefined && {
               status: validatedData.status,
            }),
            ...(validatedData.rating !== undefined && {
               rating: validatedData.rating,
            }),
            ...(validatedData.isFavorite !== undefined && {
               isFavorite: validatedData.isFavorite,
            }),
            ...(validatedData.ingredients && {
               ingredients: {
                  deleteMany: {},
                  create: validatedData.ingredients.map((ingredient) => ({
                     ingredientId: ingredient.ingredientId,
                     quantityGrams: ingredient.quantityGrams,
                  })),
               },
            }),
         },
         include: {
            ingredients: {
               include: {
                  ingredient: {
                     select: {
                        id: true,
                        name: true,
                        caloriesPer100g: true,
                        proteinPer100g: true,
                        carbsPer100g: true,
                        fatPer100g: true,
                        fiberPer100g: true,
                        category: true,
                     },
                  },
               },
            },
         },
      });
      return NextResponse.json(recipe);
   } catch (error) {
      if (error instanceof ZodError) {
         return NextResponse.json(
            { error: "Invalid data", details: error.issues },
            { status: 400 }
         );
      }
      console.error("Failed to update recipe:", error);
      return NextResponse.json(
         { error: "Failed to update recipe" },
         { status: 500 }
      );
   }
}

export async function DELETE(
   req: NextRequest,
   { params }: { params: Promise<{ id: string }> }
) {
   try {
      const resolvedParams = await params;
      const { id } = GetRecipeSchema.parse(resolvedParams);
      const recipe = await prisma.recipe.delete({
         where: { id },
      });
      return NextResponse.json(recipe);
   } catch (error) {
      if (error instanceof ZodError) {
         return NextResponse.json(
            { error: "Invalid recipe ID", details: error.issues },
            { status: 400 }
         );
      }
      console.error("Failed to delete recipe:", error);
      return NextResponse.json(
         { error: "Failed to delete recipe" },
         { status: 500 }
      );
   }
}

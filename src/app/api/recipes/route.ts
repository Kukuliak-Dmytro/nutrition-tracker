import { NextRequest, NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import prisma, { retryDatabaseOperation } from "../../../../utils/prisma/prisma";
import { calculateRecipeNutritionData } from "../../../../utils/calculations/nutrition";
import {
   CreateRecipeSchema,
   RecipeQuerySchema,
} from "../../../../utils/schemas/recipe";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
   try {
      const { searchParams } = new URL(req.url);
      const queryParams = RecipeQuerySchema.parse(
         Object.fromEntries(searchParams.entries())
      );
      const ingredientIds = queryParams.ingredients
         ? queryParams.ingredients.split(",").filter((id) => id.trim())
         : [];

      const ingredientFilter =
         ingredientIds.length > 0
            ? {
                 ingredients: {
                    some: {
                       ingredientId: {
                          in: ingredientIds,
                       },
                    },
                 },
              }
            : {};

      const search = queryParams.search?.trim();
      const where = {
         ...(queryParams.status ? { status: queryParams.status } : {}),
         ...(search
            ? {
                 OR: [
                    {
                       name: { contains: search, mode: "insensitive" as const },
                    },
                    {
                       description: {
                          contains: search,
                          mode: "insensitive" as const,
                       },
                    },
                 ],
              }
            : {}),
         ...ingredientFilter,
      };

      const sortBy = searchParams.get("sortBy");
      const sortOrder =
         (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

      const validPrismaFields = [
         "name",
         "description",
         "servings",
         "cookingTime",
         "cookedWeightGrams",
         "status",
         "rating",
         "isFavorite",
         "createdAt",
         "updatedAt",
      ];
      
      let orderBy: { [key: string]: "asc" | "desc" } | undefined = undefined;

      if (sortBy && validPrismaFields.includes(sortBy)) {
         orderBy = { [sortBy]: sortOrder };
      }

      let recipes = await retryDatabaseOperation(() =>
         prisma.recipe.findMany({
            where,
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
            orderBy: orderBy
               ? orderBy
               : {
                    createdAt: "desc",
                 },
         })
      );

      const totalRecipes = await retryDatabaseOperation(() =>
         prisma.recipe.count({ where })
      );

      recipes = recipes.filter((recipe: (typeof recipes)[0]) => {
         const nutrition = calculateRecipeNutritionData(recipe);

         if (
            queryParams.minCalories !== undefined &&
            nutrition.calories < queryParams.minCalories
         ) {
            return false;
         }
         if (
            queryParams.maxCalories !== undefined &&
            nutrition.calories > queryParams.maxCalories
         ) {
            return false;
         }

         if (
            queryParams.minCarbs !== undefined &&
            nutrition.carbs < queryParams.minCarbs
         ) {
            return false;
         }
         if (
            queryParams.maxCarbs !== undefined &&
            nutrition.carbs > queryParams.maxCarbs
         ) {
            return false;
         }

         if (
            queryParams.minProtein !== undefined &&
            nutrition.protein < queryParams.minProtein
         ) {
            return false;
         }
         if (
            queryParams.maxProtein !== undefined &&
            nutrition.protein > queryParams.maxProtein
         ) {
            return false;
         }

         if (
            queryParams.minFat !== undefined &&
            nutrition.fat < queryParams.minFat
         ) {
            return false;
         }
         if (
            queryParams.maxFat !== undefined &&
            nutrition.fat > queryParams.maxFat
         ) {
            return false;
         }

         if (
            queryParams.minFiber !== undefined &&
            nutrition.fiber < queryParams.minFiber
         ) {
            return false;
         }
         if (
            queryParams.maxFiber !== undefined &&
            nutrition.fiber > queryParams.maxFiber
         ) {
            return false;
         }

         return true;
      });

      if (sortBy && ["calories", "carbs", "protein", "fat", "fiber"].includes(sortBy)) {
         recipes.sort((a: (typeof recipes)[0], b: (typeof recipes)[0]) => {
            const nutritionA = calculateRecipeNutritionData(a);
            const nutritionB = calculateRecipeNutritionData(b);
            const valueA = nutritionA[sortBy as keyof typeof nutritionA];
            const valueB = nutritionB[sortBy as keyof typeof nutritionB];
            return sortOrder === "asc"
               ? Number(valueA) - Number(valueB)
               : Number(valueB) - Number(valueA);
         });
      }

      return NextResponse.json({
         data: recipes,
         totalRecipes,
      });
   } catch (error) {
      console.error("Error fetching recipes:", error);
      
      const isConnectionError = 
         (error instanceof PrismaClientKnownRequestError && error.code === 'P1001') ||
         (error instanceof Error && error.message.includes("Can't reach database server"));
      
      return NextResponse.json(
         { 
            error: isConnectionError 
               ? "Database connection failed. Please check your database connection and try again."
               : "Failed to fetch recipes"
         },
         { status: 500 }
      );
   }
}

export async function POST(req: NextRequest) {
   try {
      const body = await req.json();
      const validatedData = CreateRecipeSchema.parse(body);
      const recipe = await retryDatabaseOperation(() =>
         prisma.recipe.create({
         data: {
            name: validatedData.name,
            description: validatedData.description,
            servings: validatedData.servings,
            cookingTime: validatedData.cookingTime,
            cookedWeightGrams: validatedData.cookedWeightGrams,
            status: validatedData.status || "RECENT",
            rating: validatedData.rating,
            isFavorite: validatedData.isFavorite,
            ingredients: {
               create: validatedData.ingredients.map((ingredient) => ({
                  ingredientId: ingredient.ingredientId,
                  quantityGrams: ingredient.quantityGrams,
               })),
            },
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
         })
      );
      return NextResponse.json(recipe);
   } catch (error) {
      if (error instanceof ZodError) {
         console.error("Invalid recipe data:", error.issues);
         return NextResponse.json(
            { error: "Invalid recipe data. Please check all fields are filled correctly.", details: error.issues },
            { status: 400 }
         );
      }
      console.error("Failed to create recipe:", error);
      
      const isConnectionError = 
         (error instanceof PrismaClientKnownRequestError && error.code === 'P1001') ||
         (error instanceof Error && error.message.includes("Can't reach database server"));
      
      return NextResponse.json(
         { 
            error: isConnectionError 
               ? "Database connection failed. Please check your database connection and try again."
               : "Unable to create recipe. Please try again later."
         },
         { status: 500 }
      );
   }
}

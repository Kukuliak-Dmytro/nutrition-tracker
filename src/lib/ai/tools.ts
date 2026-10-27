import { tool } from "ai";
import { z } from "zod";
import prisma from "../../../utils/prisma/prisma";
import { MealType } from "@prisma/client";

export function getAgentTools(userId: string) {
  return {
    search_foods: tool({
      description:
        "Шукає продукти та страви в базі даних за назвою (серед загальних інгредієнтів та власних рецептів користувача).",
      inputSchema: z.object({
        query: z.string().describe("Назва продукту або страви, наприклад 'гречка', 'куряче філе'"),
      }),
      execute: async ({ query }: { query: string }) => {
        try {
          const [ingredients, recipes] = await Promise.all([
            prisma.ingredient.findMany({
              where: {
                OR: [{ userId: null }, { userId }],
                name: { contains: query, mode: "insensitive" },
              },
              take: 6,
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
            }),
            prisma.recipe.findMany({
              where: {
                userId,
                name: { contains: query, mode: "insensitive" },
              },
              take: 4,
              select: {
                id: true,
                name: true,
                servings: true,
                cookedWeightGrams: true,
              },
            }),
          ]);

          return {
            ingredients: ingredients.map((ing) => ({
              id: ing.id,
              name: ing.name,
              caloriesPer100g: Number(ing.caloriesPer100g),
              proteinPer100g: Number(ing.proteinPer100g),
              carbsPer100g: Number(ing.carbsPer100g),
              fatPer100g: Number(ing.fatPer100g),
              fiberPer100g: Number(ing.fiberPer100g),
              category: ing.category,
            })),
            recipes: recipes.map((r) => ({
              id: r.id,
              name: r.name,
              servings: r.servings,
              cookedWeightGrams: r.cookedWeightGrams ? Number(r.cookedWeightGrams) : null,
            })),
          };
        } catch (error) {
          console.error("search_foods tool error:", error);
          return { error: "Не вдалося виконати пошук у базі даних" };
        }
      },
    }),

    search_web_nutrition: tool({
      description:
        "Пошук харчової цінності невідомих продуктів у відкритій базі Open Food Facts, якщо їх немає в базі даних.",
      inputSchema: z.object({
        food_name: z.string().describe("Назва продукту англійською або українською"),
      }),
      execute: async ({ food_name }: { food_name: string }) => {
        try {
          const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
            food_name
          )}&search_simple=1&action=process&json=1`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeout);

          if (!res.ok) return { found: false };
          const data = await res.json();
          const product = data.products?.[0];
          if (!product) return { found: false };

          return {
            found: true,
            name: product.product_name || food_name,
            caloriesPer100g: Math.round(Number(product.nutriments?.["energy-kcal_100g"] ?? 0)),
            proteinPer100g: Number(product.nutriments?.proteins_100g ?? 0),
            carbsPer100g: Number(product.nutriments?.carbohydrates_100g ?? 0),
            fatPer100g: Number(product.nutriments?.fat_100g ?? 0),
            fiberPer100g: Number(product.nutriments?.fiber_100g ?? 0),
          };
        } catch {
          return { found: false };
        }
      },
    }),

    create_ingredient: tool({
      description:
        "Створює новий інгредієнт/продукт у бібліотеці користувача з вказанням КБЖВ на 100 грамів.",
      inputSchema: z.object({
        name: z.string().describe("Назва продукту"),
        caloriesPer100g: z.number().describe("Калорійність на 100г"),
        proteinPer100g: z.number().describe("Білки на 100г"),
        carbsPer100g: z.number().describe("Вуглеводи на 100г"),
        fatPer100g: z.number().describe("Жири на 100г"),
        fiberPer100g: z.number().optional().default(0).describe("Клітковина на 100г"),
        category: z.string().optional().default("Інше").describe("Категорія продукту"),
      }),
      execute: async (args: {
        name: string;
        caloriesPer100g: number;
        proteinPer100g: number;
        carbsPer100g: number;
        fatPer100g: number;
        fiberPer100g?: number;
        category?: string;
      }) => {
        try {
          const existing = await prisma.ingredient.findFirst({
            where: {
              name: { equals: args.name, mode: "insensitive" },
              OR: [{ userId: null }, { userId }],
            },
          });

          if (existing) {
            return {
              id: existing.id,
              name: existing.name,
              created: false,
              message: "Продукт уже існує в базі даних",
            };
          }

          const created = await prisma.ingredient.create({
            data: {
              userId,
              name: args.name,
              caloriesPer100g: args.caloriesPer100g,
              proteinPer100g: args.proteinPer100g,
              carbsPer100g: args.carbsPer100g,
              fatPer100g: args.fatPer100g,
              fiberPer100g: args.fiberPer100g ?? 0,
              category: args.category ?? "Інше",
              isCustom: true,
            },
          });

          return {
            id: created.id,
            name: created.name,
            created: true,
          };
        } catch (error) {
          console.error("create_ingredient tool error:", error);
          return { error: "Не вдалося створити інгредієнт" };
        }
      },
    }),

    log_food_entry: tool({
      description:
        "Записує спожиті страви/продукти у щоденник харчування користувача за обраний прийом їжі та дату.",
      inputSchema: z.object({
        date: z.string().describe("Дата у форматі YYYY-MM-DD"),
        mealType: z
          .enum(["BREAKFAST", "SNACK_1", "LUNCH", "SNACK_2", "DINNER"])
          .describe("Прийом їжі: BREAKFAST (сніданок), SNACK_1 (перекус 1), LUNCH (обід), SNACK_2 (перекус 2), DINNER (вечеря)"),
        items: z.array(
          z.object({
            name: z.string().describe("Назва продукту або страви"),
            weightGrams: z.number().describe("Вага в грамах"),
            calories: z.number().optional().describe("Розраховані калорії для цієї ваги"),
            protein: z.number().optional().describe("Розраховані білки для цієї ваги"),
            carbs: z.number().optional().describe("Розраховані вуглеводи для цієї ваги"),
            fat: z.number().optional().describe("Розраховані жири для цієї ваги"),
            fiber: z.number().optional().default(0).describe("Клітковина"),
            ingredientId: z.string().optional().describe("ID інгредієнта з бази, якщо знайдено"),
            recipeId: z.string().optional().describe("ID рецепту з бази, якщо знайдено"),
          })
        ),
      }),
      execute: async (args: {
        date: string;
        mealType: "BREAKFAST" | "SNACK_1" | "LUNCH" | "SNACK_2" | "DINNER";
        items: Array<{
          name: string;
          weightGrams: number;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          ingredientId?: string;
          recipeId?: string;
        }>;
      }) => {
        try {
          const [year, month, day] = args.date.split("-").map(Number);
          const entryDate = new Date(Date.UTC(year, month - 1, day));

          const createdEntries = [];

          for (const item of args.items) {
            let calories = item.calories ?? 0;
            let protein = item.protein ?? 0;
            let carbs = item.carbs ?? 0;
            let fat = item.fat ?? 0;
            let fiber = item.fiber ?? 0;
            let matchedIngredientId = item.ingredientId;

            // If macros were not provided, calculate from ingredient
            if (calories === 0 && weightGramsValid(item.weightGrams)) {
              let ing = null;
              if (matchedIngredientId) {
                ing = await prisma.ingredient.findUnique({ where: { id: matchedIngredientId } });
              } else {
                ing = await prisma.ingredient.findFirst({
                  where: {
                    name: { contains: item.name, mode: "insensitive" },
                    OR: [{ userId: null }, { userId }],
                  },
                });
              }

              if (ing) {
                matchedIngredientId = ing.id;
                const ratio = item.weightGrams / 100;
                calories = Math.round(Number(ing.caloriesPer100g) * ratio * 10) / 10;
                protein = Math.round(Number(ing.proteinPer100g) * ratio * 10) / 10;
                carbs = Math.round(Number(ing.carbsPer100g) * ratio * 10) / 10;
                fat = Math.round(Number(ing.fatPer100g) * ratio * 10) / 10;
                fiber = Math.round(Number(ing.fiberPer100g) * ratio * 10) / 10;
              }
            }

            const entry = await prisma.foodLogEntry.create({
              data: {
                userId,
                date: entryDate,
                mealType: args.mealType as MealType,
                name: item.name,
                weightGrams: item.weightGrams,
                calories,
                protein,
                carbs,
                fat,
                fiber,
                ingredientId: matchedIngredientId || null,
                recipeId: item.recipeId || null,
              },
            });

            createdEntries.push({
              id: entry.id,
              name: entry.name,
              weightGrams: Number(entry.weightGrams),
              calories: Number(entry.calories),
              protein: Number(entry.protein),
              carbs: Number(entry.carbs),
              fat: Number(entry.fat),
              fiber: Number(entry.fiber),
            });
          }

          const totals = createdEntries.reduce(
            (acc, curr) => ({
              calories: Math.round((acc.calories + curr.calories) * 10) / 10,
              protein: Math.round((acc.protein + curr.protein) * 10) / 10,
              carbs: Math.round((acc.carbs + curr.carbs) * 10) / 10,
              fat: Math.round((acc.fat + curr.fat) * 10) / 10,
              fiber: Math.round((acc.fiber + curr.fiber) * 10) / 10,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
          );

          return {
            success: true,
            mealType: args.mealType,
            date: args.date,
            entriesCount: createdEntries.length,
            entries: createdEntries,
            totals,
          };
        } catch (error) {
          console.error("log_food_entry tool error:", error);
          return { error: "Не вдалося записати прийом їжі в базу даних" };
        }
      },
    }),

    get_logged_meals: tool({
      description:
        "Отримує список усіх спожитих страв і розраховані сумарні КБЖВ за обрану дату.",
      inputSchema: z.object({
        date: z.string().describe("Дата у форматі YYYY-MM-DD"),
      }),
      execute: async ({ date }: { date: string }) => {
        try {
          const [year, month, day] = date.split("-").map(Number);
          const targetDate = new Date(Date.UTC(year, month - 1, day));

          const entries = await prisma.foodLogEntry.findMany({
            where: {
              userId,
              date: targetDate,
            },
            orderBy: { createdAt: "asc" },
          });

          const totals = entries.reduce(
            (acc, curr) => ({
              calories: Math.round((acc.calories + Number(curr.calories)) * 10) / 10,
              protein: Math.round((acc.protein + Number(curr.protein)) * 10) / 10,
              carbs: Math.round((acc.carbs + Number(curr.carbs)) * 10) / 10,
              fat: Math.round((acc.fat + Number(curr.fat)) * 10) / 10,
              fiber: Math.round((acc.fiber + Number(curr.fiber)) * 10) / 10,
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
          );

          return {
            date,
            count: entries.length,
            entries: entries.map((e) => ({
              id: e.id,
              name: e.name,
              mealType: e.mealType,
              weightGrams: e.weightGrams ? Number(e.weightGrams) : null,
              calories: Number(e.calories),
              protein: Number(e.protein),
              carbs: Number(e.carbs),
              fat: Number(e.fat),
            })),
            totals,
          };
        } catch (error) {
          console.error("get_logged_meals error:", error);
          return { error: "Не вдалося отримати записи харчування" };
        }
      },
    }),

    delete_logged_meal: tool({
      description: "Видаляє конкретний запис споживання їжі зі щоденника за його ID.",
      inputSchema: z.object({
        entryId: z.string().describe("ID запису в таблиці food_log_entries"),
      }),
      execute: async ({ entryId }: { entryId: string }) => {
        try {
          const existing = await prisma.foodLogEntry.findFirst({
            where: { id: entryId, userId },
          });

          if (!existing) {
            return { error: "Запис не знайдено або у вас немає прав на його видалення" };
          }

          await prisma.foodLogEntry.delete({
            where: { id: entryId },
          });

          return { success: true, deletedName: existing.name };
        } catch (error) {
          console.error("delete_logged_meal error:", error);
          return { error: "Не вдалося видалити запис" };
        }
      },
    }),
  };
}

function weightGramsValid(w: unknown): w is number {
  return typeof w === "number" && !isNaN(w) && w > 0;
}

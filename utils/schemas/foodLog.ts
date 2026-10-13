import { z } from "zod";

export const MealTypeSchema = z.enum([
  "BREAKFAST",
  "SNACK_1",
  "LUNCH",
  "SNACK_2",
  "DINNER",
]);

export type MealType = z.infer<typeof MealTypeSchema>;

export const FoodLogEntrySchema = z.object({
  id: z.string().optional(),
  date: z.string(), // YYYY-MM-DD or ISO string
  mealType: MealTypeSchema,
  name: z.string().min(1, "Назва обов'язкова"),
  recipeId: z.string().uuid().nullable().optional(),
  ingredientId: z.string().uuid().nullable().optional(),
  weightGrams: z.coerce.number().positive().nullable().optional(),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fiber: z.coerce.number().min(0).default(0),
});

export const CreateFoodLogEntrySchema = FoodLogEntrySchema;

export const UpdateFoodLogEntrySchema = FoodLogEntrySchema.partial();

export const FoodLogEntryResponseSchema = FoodLogEntrySchema.extend({
  id: z.string(),
  createdAt: z.string().transform((s) => new Date(s).toISOString()),
});

export type FoodLogEntry = z.infer<typeof FoodLogEntrySchema>;
export type CreateFoodLogEntry = z.infer<typeof CreateFoodLogEntrySchema>;
export type UpdateFoodLogEntry = z.infer<typeof UpdateFoodLogEntrySchema>;
export type FoodLogEntryResponse = z.infer<typeof FoodLogEntryResponseSchema>;

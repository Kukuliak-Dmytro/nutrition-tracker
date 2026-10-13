import { z } from "zod";

export const GetRecipeSchema = z.object({
  id: z.string(),
});

export const RecipeStatusSchema = z.enum(["RECENT", "ARCHIVED"]);
export type RecipeStatus = z.infer<typeof RecipeStatusSchema>;

export const RecipeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Назва повинна містити щонайменше 2 символи"),
  description: z.string().nullable().optional(),
  servings: z.coerce.number().int().min(1, "Порції мають бути щонайменше 1").default(1),
  cookingTime: z.string().nullable().optional(),
  cookedWeightGrams: z.coerce
    .number()
    .positive("Готова вага має бути додатною")
    .max(100000, "Занадто велика вага")
    .nullable()
    .optional(),
  status: RecipeStatusSchema.default("RECENT"),
  rating: z.coerce
    .number()
    .int()
    .min(1)
    .max(100, "Оцінка має бути від 1 до 100")
    .nullable()
    .optional(),
  isFavorite: z.boolean().optional(),
});

export const RecipeIngredientInputSchema = z.object({
  ingredientId: z.string().min(1, "Інгредієнт обов'язковий"),
  quantityGrams: z.coerce
    .number()
    .positive("Кількість має бути додатною")
    .max(50000, "Кількість має бути менше 50000г"),
});

export const CreateRecipeSchema = RecipeSchema.extend({
  ingredients: z
    .array(RecipeIngredientInputSchema)
    .min(1, "Страва повинна містити щонайменше один інгредієнт"),
});

export const UpdateRecipeSchema = RecipeSchema.partial().extend({
  ingredients: z.array(RecipeIngredientInputSchema).optional(),
});

export const RecipeIngredientResponseSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  ingredientId: z.string(),
  quantityGrams: z.coerce.number(),
  ingredient: z.object({
    id: z.string(),
    name: z.string(),
    caloriesPer100g: z.coerce.number(),
    proteinPer100g: z.coerce.number(),
    carbsPer100g: z.coerce.number(),
    fatPer100g: z.coerce.number(),
    fiberPer100g: z.coerce.number().default(0),
    category: z.string().nullable(),
    isCustom: z.boolean().optional(),
    createdAt: z.string().optional(),
  }),
});

export const RecipeResponseSchema = RecipeSchema.extend({
  id: z.string(),
  createdAt: z.string().transform((str) => new Date(str)),
  updatedAt: z.string().transform((str) => new Date(str)),
  ingredients: z.array(RecipeIngredientResponseSchema).optional(),
});

export const RecipeQuerySchema = z.object({
  search: z.string().optional(),
  status: RecipeStatusSchema.optional(),
  ingredients: z.string().optional(),
  minCalories: z.coerce.number().optional(),
  maxCalories: z.coerce.number().optional(),
  minProtein: z.coerce.number().optional(),
  maxProtein: z.coerce.number().optional(),
  minCarbs: z.coerce.number().optional(),
  maxCarbs: z.coerce.number().optional(),
  minFat: z.coerce.number().optional(),
  maxFat: z.coerce.number().optional(),
  minFiber: z.coerce.number().optional(),
  maxFiber: z.coerce.number().optional(),
  isFavorite: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["name", "rating", "createdAt", "updatedAt", "cookedWeightGrams"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type CreateRecipe = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipe = z.infer<typeof UpdateRecipeSchema>;
export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;
export type RecipeIngredientResponse = z.infer<typeof RecipeIngredientResponseSchema>;
export type RecipeQuery = z.infer<typeof RecipeQuerySchema>;
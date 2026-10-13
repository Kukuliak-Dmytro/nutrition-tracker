import { z } from "zod";

export const GetIngredientSchema = z.object({
  id: z.string(),
});

export const IngredientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Назва повинна містити щонайменше 2 символи"),
  caloriesPer100g: z.coerce
    .number()
    .min(0)
    .max(10000, "Калорійність має бути в діапазоні 0-10000"),
  proteinPer100g: z.coerce
    .number()
    .min(0)
    .max(100, "Білки мають бути в діапазоні 0-100г"),
  carbsPer100g: z.coerce
    .number()
    .min(0)
    .max(100, "Вуглеводи мають бути в діапазоні 0-100г"),
  fatPer100g: z.coerce
    .number()
    .min(0)
    .max(100, "Жири мають бути в діапазоні 0-100г"),
  fiberPer100g: z.coerce
    .number()
    .min(0)
    .max(100, "Клітковина має бути в діапазоні 0-100г")
    .default(0),
  category: z.string().optional(),
});

export const CreateIngredientSchema = IngredientSchema;
export const UpdateIngredientSchema = IngredientSchema.partial();

export const IngredientResponseSchema = IngredientSchema.extend({
  id: z.string().optional(),
  fiberPer100g: z.coerce.number().default(0),
  isCustom: z.boolean(),
  createdAt: z.string().transform((str) => new Date(str).toISOString()),
});

export const IngredientResponseArraySchema = z.array(IngredientResponseSchema);

export const PaginatedIngredientsResponseSchema = z.object({
  data: z.array(IngredientResponseSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  totalIngredients: z.number(),
});

export const IngredientQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(10000).optional(),
    search: z.string().optional(),
    minCalories: z.coerce.number().min(0).max(10000).optional(),
    maxCalories: z.coerce.number().min(0).max(10000).optional(),
    minProtein: z.coerce.number().min(0).max(100).optional(),
    maxProtein: z.coerce.number().min(0).max(100).optional(),
    minCarbs: z.coerce.number().min(0).max(100).optional(),
    maxCarbs: z.coerce.number().min(0).max(100).optional(),
    minFat: z.coerce.number().min(0).max(100).optional(),
    maxFat: z.coerce.number().min(0).max(100).optional(),
    minFiber: z.coerce.number().min(0).max(100).optional(),
    maxFiber: z.coerce.number().min(0).max(100).optional(),
    sortBy: z
      .enum([
        "name",
        "caloriesPer100g",
        "proteinPer100g",
        "carbsPer100g",
        "fatPer100g",
        "fiberPer100g",
        "category",
        "createdAt",
      ])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  });

export type Ingredient = z.infer<typeof IngredientSchema>;
export type CreateIngredient = z.infer<typeof CreateIngredientSchema>;
export type UpdateIngredient = z.infer<typeof UpdateIngredientSchema>;
export type IngredientResponse = z.infer<typeof IngredientResponseSchema>;
export type PaginatedIngredientsResponse = z.infer<
  typeof PaginatedIngredientsResponseSchema
>;
export type IngredientQuery = z.infer<typeof IngredientQuerySchema>;

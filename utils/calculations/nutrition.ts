export interface NutritionalData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  quantityGrams: number;
  nutritionalData: NutritionalData;
}

const round1 = (val: number) => Math.round(val * 10) / 10;

export function calculateIngredientNutrition(
  nutritionalDataPer100g: NutritionalData,
  quantityGrams: number
): NutritionalData {
  return {
    calories: round1((nutritionalDataPer100g.calories * quantityGrams) / 100),
    protein: round1((nutritionalDataPer100g.protein * quantityGrams) / 100),
    carbs: round1((nutritionalDataPer100g.carbs * quantityGrams) / 100),
    fat: round1((nutritionalDataPer100g.fat * quantityGrams) / 100),
    fiber: round1(((nutritionalDataPer100g.fiber || 0) * quantityGrams) / 100),
  };
}

export function calculateRecipeNutrition(
  recipeIngredients: RecipeIngredient[]
): NutritionalData {
  return recipeIngredients.reduce(
    (total, ingredient) => {
      const calc = calculateIngredientNutrition(
        ingredient.nutritionalData,
        ingredient.quantityGrams
      );

      return {
        calories: round1(total.calories + calc.calories),
        protein: round1(total.protein + calc.protein),
        carbs: round1(total.carbs + calc.carbs),
        fat: round1(total.fat + calc.fat),
        fiber: round1(total.fiber + calc.fiber),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

export function calculateCookedNutritionPer100g(
  totalNutrition: NutritionalData,
  cookedWeightGrams: number
): NutritionalData {
  if (!cookedWeightGrams || cookedWeightGrams <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }
  return {
    calories: round1((totalNutrition.calories / cookedWeightGrams) * 100),
    protein: round1((totalNutrition.protein / cookedWeightGrams) * 100),
    carbs: round1((totalNutrition.carbs / cookedWeightGrams) * 100),
    fat: round1((totalNutrition.fat / cookedWeightGrams) * 100),
    fiber: round1((totalNutrition.fiber / cookedWeightGrams) * 100),
  };
}

export function calculatePortionNutrition(
  per100g: NutritionalData,
  portionGrams: number
): NutritionalData {
  return {
    calories: round1((per100g.calories * portionGrams) / 100),
    protein: round1((per100g.protein * portionGrams) / 100),
    carbs: round1((per100g.carbs * portionGrams) / 100),
    fat: round1((per100g.fat * portionGrams) / 100),
    fiber: round1((per100g.fiber * portionGrams) / 100),
  };
}

export function calculateNutritionPerServing(
  totalNutrition: NutritionalData,
  servings: number
): NutritionalData {
  if (servings <= 0) return totalNutrition;
  return {
    calories: round1(totalNutrition.calories / servings),
    protein: round1(totalNutrition.protein / servings),
    carbs: round1(totalNutrition.carbs / servings),
    fat: round1(totalNutrition.fat / servings),
    fiber: round1(totalNutrition.fiber / servings),
  };
}

interface RecipeIngredientInput {
  ingredientId?: string;
  quantityGrams: number | string | { toString(): string };
  ingredient: {
    caloriesPer100g: number | string | { toString(): string };
    proteinPer100g: number | string | { toString(): string };
    carbsPer100g: number | string | { toString(): string };
    fatPer100g: number | string | { toString(): string };
    fiberPer100g?: number | string | { toString(): string } | null;
  };
}

interface RecipeInput {
  cookedWeightGrams?: number | string | { toString(): string } | null;
  ingredients?: RecipeIngredientInput[];
}

export function calculateRecipeNutritionData(recipe: RecipeInput): NutritionalData {
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  }

  const recipeIngredients: RecipeIngredient[] = recipe.ingredients.map(
    (item: RecipeIngredientInput) => ({
      ingredientId: item.ingredientId || "",
      quantityGrams: Number(
        typeof item.quantityGrams === "object"
          ? item.quantityGrams.toString()
          : item.quantityGrams
      ),
      nutritionalData: {
        calories: Number(
          typeof item.ingredient.caloriesPer100g === "object"
            ? item.ingredient.caloriesPer100g.toString()
            : item.ingredient.caloriesPer100g
        ),
        protein: Number(
          typeof item.ingredient.proteinPer100g === "object"
            ? item.ingredient.proteinPer100g.toString()
            : item.ingredient.proteinPer100g
        ),
        carbs: Number(
          typeof item.ingredient.carbsPer100g === "object"
            ? item.ingredient.carbsPer100g.toString()
            : item.ingredient.carbsPer100g
        ),
        fat: Number(
          typeof item.ingredient.fatPer100g === "object"
            ? item.ingredient.fatPer100g.toString()
            : item.ingredient.fatPer100g
        ),
        fiber: Number(
          item.ingredient.fiberPer100g
            ? typeof item.ingredient.fiberPer100g === "object"
              ? item.ingredient.fiberPer100g.toString()
              : item.ingredient.fiberPer100g
            : 0
        ),
      },
    })
  );

  return calculateRecipeNutrition(recipeIngredients);
}
import prisma from "../../utils/prisma/prisma";
import fs from "fs";

interface IngredientData {
  name: string;
  category?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

async function importIngredientsToDB() {
  try {
    console.log("Importing ingredients to database...");
    const data = fs.readFileSync("src/scripts/data/ingredients.json", "utf-8");
    const ingredients: IngredientData[] = JSON.parse(data);
    for (let i = 0; i < ingredients.length; i++) {
      const ingredient = ingredients[i];
      await prisma.ingredient.upsert({
        where: { name: ingredient.name },
        update: {
          caloriesPer100g: ingredient.calories,
          proteinPer100g: ingredient.protein,
          carbsPer100g: ingredient.carbs,
          fatPer100g: ingredient.fat,
          category: ingredient.category || "Інше",
          isCustom: false,
          createdAt: new Date(),
        },
        create: {
          name: ingredient.name,
          caloriesPer100g: ingredient.calories,
          proteinPer100g: ingredient.protein,
          carbsPer100g: ingredient.carbs,
          fatPer100g: ingredient.fat,
          category: ingredient.category || "Інше",
          isCustom: false,
          createdAt: new Date(),
        },
      });
      console.log(
        `Imported ${i + 1} of ${ingredients.length} ingredients: ${
          ingredient.name
        }`
      );
    }
    console.log("Ingredients imported successfully");
  } catch (error) {
    console.error("Error importing ingredients to database:", error);
  }
}

importIngredientsToDB();

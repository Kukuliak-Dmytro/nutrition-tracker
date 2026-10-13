import prisma from "../../utils/prisma/prisma";
import fs from "fs";
import path from "path";

interface RecipeIngredient {
  name: string;
  quantityGrams: number;
}

interface RecipeData {
  name: string;
  description?: string;
  instructions: string;
  servings: number;
  cookingTime?: string;
  ingredients: RecipeIngredient[];
}

async function importRecipes() {
  try {
    console.log("Читання рецептів з JSON файлу...");
    const jsonPath = path.join(__dirname, "data", "recipes.json");
    
    if (!fs.existsSync(jsonPath)) {
      console.error(`Файл не знайдено: ${jsonPath}`);
      return;
    }

    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const recipes: RecipeData[] = JSON.parse(jsonContent);

    console.log(`Знайдено ${recipes.length} рецептів для імпорту\n`);

    for (let i = 0; i < recipes.length; i++) {
      const recipe = recipes[i];
      console.log(`[${i + 1}/${recipes.length}] Обробка рецепта: "${recipe.name}"`);

      // Перевіряємо, чи рецепт вже існує
      const existingRecipe = await prisma.recipe.findFirst({
        where: { name: recipe.name },
      });

      if (existingRecipe) {
        console.log(`⚠️  Рецепт "${recipe.name}" вже існує в базі (ID: ${existingRecipe.id}). Пропускаю...\n`);
        continue;
      }

      // Знаходимо або створюємо інгредієнти та об'єднуємо однакові
      const ingredientMap = new Map<string, number>(); // для об'єднання однакових інгредієнтів

      // Спочатку об'єднуємо однакові інгредієнти
      for (const ing of recipe.ingredients) {
        ingredientMap.set(ing.name, (ingredientMap.get(ing.name) || 0) + ing.quantityGrams);
      }

      // Тепер знаходимо або створюємо інгредієнти
      const finalIngredients = [];
      for (const [name, totalGrams] of ingredientMap.entries()) {
        let ingredient = await prisma.ingredient.findUnique({
          where: { name },
        });

        if (!ingredient) {
          console.log(`   ⚠️  Інгредієнт "${name}" не знайдено в базі. Створюю...`);
          // Створюємо базовий інгредієнт (можна буде оновити пізніше)
          ingredient = await prisma.ingredient.create({
            data: {
              name: name,
              category: "Інше",
              caloriesPer100g: 0,
              proteinPer100g: 0,
              carbsPer100g: 0,
              fatPer100g: 0,
              isCustom: true,
            },
          });
        }

        finalIngredients.push({
          ingredientId: ingredient.id,
          quantityGrams: totalGrams,
        });
      }

      console.log(`   Створення рецепта з ${finalIngredients.length} інгредієнтами...`);
      const createdRecipe = await prisma.recipe.create({
        data: {
          name: recipe.name,
          description: recipe.description,
          servings: recipe.servings,
          cookingTime: recipe.cookingTime,
          cookedWeightGrams: finalIngredients.reduce((s, i) => s + i.quantityGrams, 0),
          status: "RECENT",
          ingredients: {
            create: finalIngredients,
          },
        },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      console.log(`   ✅ Рецепт "${recipe.name}" успішно додано до бази даних!`);
      console.log(`      ID: ${createdRecipe.id}`);
      console.log(`      Порцій: ${recipe.servings}`);
      console.log(`      Інгредієнтів: ${finalIngredients.length}\n`);
    }

    console.log(`\n🎉 Імпорт завершено! Оброблено ${recipes.length} рецептів.`);
  } catch (error) {
    console.error("Помилка при імпорті рецептів:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

importRecipes();

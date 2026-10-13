import prisma from "../utils/prisma/prisma";
import fs from "fs";
import { MealType } from "@prisma/client";

interface DishPer100g {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

interface PreparedDish {
  name: string;
  total_cooked_weight_g?: number;
  total_pieces?: number;
  per_100g: DishPer100g;
  per_piece?: DishPer100g;
}

interface BreakdownItem {
  name: string;
  weight_g?: number;
  weight_with_peel_g?: number;
  edible_weight_g?: number;
  pieces?: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

interface DayLogData {
  totals: DishPer100g;
  meals?: Record<string, string>;
  meal_breakdown?: Record<string, BreakdownItem[]>;
  status?: string;
  notes?: string;
}

interface PlanckData {
  user_profile: {
    height_cm: number;
    weight_kg: number;
    daily_target_calories: number;
    maintenance_calories: number;
    target_protein_g: [number, number];
    target_fiber_g: [number, number];
  };
  prepared_dishes: Record<string, PreparedDish>;
  log: Record<string, DayLogData>;
}

const DATA_PATH = "/Users/dimi/Documents/antigravity/delightful-planck/data.json";

function makeUtcDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

async function main() {
  console.log("Loading data from:", DATA_PATH);
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`Data file not found at ${DATA_PATH}`);
  }

  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const data: PlanckData = JSON.parse(raw);

  // 1. Update Daily Goals
  console.log("--- Updating Daily Goals ---");
  await prisma.dailyGoal.upsert({
    where: { id: "default" },
    update: {
      calories: data.user_profile.daily_target_calories || 2200,
      protein: 150.0,
      carbs: 230.0,
      fat: 65.0,
      fiber: 30.0,
    },
    create: {
      id: "default",
      calories: data.user_profile.daily_target_calories || 2200,
      protein: 150.0,
      carbs: 230.0,
      fat: 65.0,
      fiber: 30.0,
    },
  });
  console.log("Daily goal set: 2200 kcal | 150g P | 230g C | 65g F | 30g Fiber");

  // 2. Archive legacy demo recipes so only user recipes are RECENT
  console.log("--- Archiving legacy demo recipes ---");
  await prisma.recipe.updateMany({
    data: { status: "ARCHIVED" },
  });

  // 3. Upsert Prepared Dishes as Ingredients & RECENT Recipes
  console.log("--- Importing Prepared Dishes ---");
  const dishMap = new Map<string, { recipeId: string; ingredientId: string; name: string }>();

  for (const [, dish] of Object.entries(data.prepared_dishes)) {
    const cookedWeight = dish.total_cooked_weight_g || 1000;

    // Upsert Ingredient
    const ingredient = await prisma.ingredient.upsert({
      where: { name: dish.name },
      update: {
        caloriesPer100g: dish.per_100g.calories,
        proteinPer100g: dish.per_100g.protein,
        fatPer100g: dish.per_100g.fat,
        carbsPer100g: dish.per_100g.carbs,
        fiberPer100g: dish.per_100g.fiber,
        category: "Готові страви",
        isCustom: false,
      },
      create: {
        name: dish.name,
        caloriesPer100g: dish.per_100g.calories,
        proteinPer100g: dish.per_100g.protein,
        fatPer100g: dish.per_100g.fat,
        carbsPer100g: dish.per_100g.carbs,
        fiberPer100g: dish.per_100g.fiber,
        category: "Готові страви",
        isCustom: false,
      },
    });

    // Check if recipe exists
    let recipe = await prisma.recipe.findFirst({
      where: { name: dish.name },
    });

    if (recipe) {
      recipe = await prisma.recipe.update({
        where: { id: recipe.id },
        data: {
          cookedWeightGrams: cookedWeight,
          status: "RECENT",
          description: dish.total_pieces ? `Всього штук: ${dish.total_pieces}` : undefined,
        },
      });
    } else {
      recipe = await prisma.recipe.create({
        data: {
          name: dish.name,
          cookedWeightGrams: cookedWeight,
          status: "RECENT",
          servings: 1,
          description: dish.total_pieces ? `Всього штук: ${dish.total_pieces}` : undefined,
        },
      });
    }

    // Connect RecipeIngredient
    await prisma.recipeIngredient.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
        },
      },
      update: {
        quantityGrams: cookedWeight,
      },
      create: {
        recipeId: recipe.id,
        ingredientId: ingredient.id,
        quantityGrams: cookedWeight,
      },
    });

    dishMap.set(dish.name, {
      recipeId: recipe.id,
      ingredientId: ingredient.id,
      name: dish.name,
    });
    console.log(`✓ Imported dish: "${dish.name}" (${cookedWeight}g)`);
  }

  // 4. Clear existing FoodLogEntry records
  console.log("--- Clearing existing FoodLogEntry records ---");
  await prisma.foodLogEntry.deleteMany({});

  // 5. Build Days data mapping
  // Map Day 1..9 to 2026-10-05 .. 2026-10-13
  const dateMap: Record<string, string> = {
    day_1: "2026-10-05",
    day_2: "2026-10-06",
    day_3: "2026-10-07",
    day_4: "2026-10-08",
    day_5: "2026-10-09",
    day_6: "2026-10-10",
    day_7: "2026-10-11",
    day_8: "2026-10-12",
    day_9: "2026-10-13",
  };

  // Helper to match dish/ingredient
  function findDish(name: string) {
    for (const [dishName, val] of dishMap.entries()) {
      if (dishName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(dishName.toLowerCase())) {
        return val;
      }
    }
    return null;
  }

  interface EntryToCreate {
    date: Date;
    mealType: MealType;
    name: string;
    recipeId?: string;
    ingredientId?: string;
    weightGrams?: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
  }

  const entriesToInsert: EntryToCreate[] = [];

  // --- DAY 1 (2026-10-05) ---
  const d1Date = makeUtcDate(dateMap.day_1);
  const p1 = findDish("Паста з курячим філе та грецьким йогуртом");
  const c1 = findDish("Салат зі свіжої капусти та моркви");
  const pl1 = findDish("Плов із булгуром та свинячим битком");
  const k1 = findDish("Морква по-корейськи");
  const l1 = findDish("Варена сочевиця з куркою");

  entriesToInsert.push(
    // Breakfast: 481 kcal
    {
      date: d1Date,
      mealType: "BREAKFAST",
      name: "Паста з курячим філе та грецьким йогуртом",
      recipeId: p1?.recipeId,
      ingredientId: p1?.ingredientId,
      weightGrams: 400,
      calories: 454.0,
      protein: 44.8,
      fat: 5.6,
      carbs: 51.2,
      fiber: 2.3,
    },
    {
      date: d1Date,
      mealType: "BREAKFAST",
      name: "Салат зі свіжої капусти та моркви",
      recipeId: c1?.recipeId,
      ingredientId: c1?.ingredientId,
      weightGrams: 100,
      calories: 27.0,
      protein: 1.3,
      fat: 0.1,
      carbs: 5.3,
      fiber: 2.0,
    },
    // Lunch: 650 kcal
    {
      date: d1Date,
      mealType: "LUNCH",
      name: "Плов із булгуром та свинячим битком",
      recipeId: pl1?.recipeId,
      ingredientId: pl1?.ingredientId,
      weightGrams: 450,
      calories: 585.0,
      protein: 38.0,
      fat: 15.8,
      carbs: 71.8,
      fiber: 10.8,
    },
    {
      date: d1Date,
      mealType: "LUNCH",
      name: "Морква по-корейськи",
      recipeId: k1?.recipeId,
      ingredientId: k1?.ingredientId,
      weightGrams: 100,
      calories: 65.0,
      protein: 1.6,
      fat: 2.3,
      carbs: 9.4,
      fiber: 2.5,
    },
    // Snack 1: 698 kcal
    {
      date: d1Date,
      mealType: "SNACK_1",
      name: "Кефір 1% (400 г) + яблуко (150 г) та перекуси",
      weightGrams: 550,
      calories: 698.0,
      protein: 26.4,
      fat: 35.2,
      carbs: 64.2,
      fiber: 3.3,
    },
    // Dinner: 351 kcal
    {
      date: d1Date,
      mealType: "DINNER",
      name: "Варена сочевиця з куркою",
      recipeId: l1?.recipeId,
      ingredientId: l1?.ingredientId,
      weightGrams: 400,
      calories: 324.0,
      protein: 32.6,
      fat: 2.9,
      carbs: 40.8,
      fiber: 9.8,
    },
    {
      date: d1Date,
      mealType: "DINNER",
      name: "Салат зі свіжої капусти та моркви",
      recipeId: c1?.recipeId,
      ingredientId: c1?.ingredientId,
      weightGrams: 100,
      calories: 27.0,
      protein: 1.3,
      fat: 0.1,
      carbs: 5.3,
      fiber: 2.0,
    }
  );

  // --- DAY 2 (2026-10-06) ---
  const d2Date = makeUtcDate(dateMap.day_2);
  entriesToInsert.push(
    // Breakfast: 589.5 kcal
    {
      date: d2Date,
      mealType: "BREAKFAST",
      name: "Варена сочевиця з куркою",
      recipeId: l1?.recipeId,
      ingredientId: l1?.ingredientId,
      weightGrams: 450,
      calories: 364.5,
      protein: 36.7,
      fat: 3.3,
      carbs: 45.9,
      fiber: 11.0,
    },
    {
      date: d2Date,
      mealType: "BREAKFAST",
      name: "Морква по-корейськи",
      recipeId: k1?.recipeId,
      ingredientId: k1?.ingredientId,
      weightGrams: 100,
      calories: 65.0,
      protein: 1.6,
      fat: 2.3,
      carbs: 9.4,
      fiber: 2.5,
    },
    {
      date: d2Date,
      mealType: "BREAKFAST",
      name: "Кефір 1%",
      weightGrams: 400,
      calories: 160.0,
      protein: 12.0,
      fat: 4.0,
      carbs: 16.0,
      fiber: 0.0,
    },
    // Lunch: 551.3 kcal
    {
      date: d2Date,
      mealType: "LUNCH",
      name: "Паста з курячим філе та грецьким йогуртом",
      recipeId: p1?.recipeId,
      ingredientId: p1?.ingredientId,
      weightGrams: 450,
      calories: 510.8,
      protein: 50.4,
      fat: 6.3,
      carbs: 57.6,
      fiber: 2.6,
    },
    {
      date: d2Date,
      mealType: "LUNCH",
      name: "Салат зі свіжої капусти та моркви",
      recipeId: c1?.recipeId,
      ingredientId: c1?.ingredientId,
      weightGrams: 150,
      calories: 40.5,
      protein: 2.0,
      fat: 0.2,
      carbs: 8.0,
      fiber: 3.0,
    },
    // Snack 1: 462.2 kcal
    {
      date: d2Date,
      mealType: "SNACK_1",
      name: "Яблуко (140 г) + чорний шоколад (30 г) та перекус",
      weightGrams: 170,
      calories: 462.2,
      protein: 14.2,
      fat: 27.7,
      carbs: 36.0,
      fiber: 5.2,
    },
    // Dinner: 547 kcal
    {
      date: d2Date,
      mealType: "DINNER",
      name: "Плов із булгуром та свинячим битком",
      recipeId: pl1?.recipeId,
      ingredientId: pl1?.ingredientId,
      weightGrams: 400,
      calories: 520.0,
      protein: 33.8,
      fat: 14.1,
      carbs: 63.8,
      fiber: 9.6,
    },
    {
      date: d2Date,
      mealType: "DINNER",
      name: "Салат зі свіжої капусти та моркви",
      recipeId: c1?.recipeId,
      ingredientId: c1?.ingredientId,
      weightGrams: 100,
      calories: 27.0,
      protein: 1.3,
      fat: 0.1,
      carbs: 5.3,
      fiber: 2.0,
    }
  );

  // --- DAY 3 (2026-10-07) ---
  const d3Date = makeUtcDate(dateMap.day_3);
  entriesToInsert.push(
    {
      date: d3Date,
      mealType: "BREAKFAST",
      name: "Варена сочевиця та плов із куркою",
      weightGrams: 500,
      calories: 800.0,
      protein: 45.0,
      fat: 20.0,
      carbs: 105.0,
      fiber: 5.5,
    },
    {
      date: d3Date,
      mealType: "LUNCH",
      name: "Основні заготовлені страви + перекуси",
      weightGrams: 500,
      calories: 800.0,
      protein: 35.0,
      fat: 25.0,
      carbs: 105.0,
      fiber: 5.5,
    },
    {
      date: d3Date,
      mealType: "DINNER",
      name: "Хот-доги, сосиски, сушені курячі чіпси, солодкі напої та солодощі",
      weightGrams: 900,
      calories: 1906.0,
      protein: 68.0,
      fat: 83.0,
      carbs: 225.0,
      fiber: 6.8,
    }
  );

  // --- DAY 4 (2026-10-08) ---
  const d4Date = makeUtcDate(dateMap.day_4);
  entriesToInsert.push(
    // Breakfast: 707 kcal
    {
      date: d4Date,
      mealType: "BREAKFAST",
      name: "Плов із булгуром та свинячим битком",
      recipeId: pl1?.recipeId,
      ingredientId: pl1?.ingredientId,
      weightGrams: 400,
      calories: 520.0,
      protein: 33.8,
      fat: 14.1,
      carbs: 63.8,
      fiber: 9.6,
    },
    {
      date: d4Date,
      mealType: "BREAKFAST",
      name: "Салат зі свіжої капусти та моркви",
      recipeId: c1?.recipeId,
      ingredientId: c1?.ingredientId,
      weightGrams: 100,
      calories: 27.0,
      protein: 1.3,
      fat: 0.1,
      carbs: 5.3,
      fiber: 2.0,
    },
    {
      date: d4Date,
      mealType: "BREAKFAST",
      name: "Кефір 1%",
      weightGrams: 400,
      calories: 160.0,
      protein: 12.0,
      fat: 4.0,
      carbs: 16.0,
      fiber: 0.0,
    },
    // Lunch: 457 kcal
    {
      date: d4Date,
      mealType: "LUNCH",
      name: "Варена сочевиця з куркою",
      recipeId: l1?.recipeId,
      ingredientId: l1?.ingredientId,
      weightGrams: 400,
      calories: 324.0,
      protein: 32.6,
      fat: 2.9,
      carbs: 40.8,
      fiber: 9.8,
    },
    {
      date: d4Date,
      mealType: "LUNCH",
      name: "Морква по-корейськи",
      recipeId: k1?.recipeId,
      ingredientId: k1?.ingredientId,
      weightGrams: 100,
      calories: 65.0,
      protein: 1.6,
      fat: 2.3,
      carbs: 9.4,
      fiber: 2.5,
    },
    {
      date: d4Date,
      mealType: "LUNCH",
      name: "Яблуко",
      weightGrams: 130,
      calories: 68.0,
      protein: 0.5,
      fat: 0.3,
      carbs: 18.0,
      fiber: 3.1,
    },
    // Snack 1: 321 kcal
    {
      date: d4Date,
      mealType: "SNACK_1",
      name: "Шоколадний батончик Roshen (40 г) + курячі чіпси (50 г) + яблуко (122 г)",
      weightGrams: 212,
      calories: 321.0,
      protein: 28.7,
      fat: 7.9,
      carbs: 37.1,
      fiber: 3.2,
    },
    // Dinner: 580 kcal
    {
      date: d4Date,
      mealType: "DINNER",
      name: "Домашній хот-дог (булочка 100г, сосиска 70г, салат 60г, кетчуп+майонез 40г)",
      weightGrams: 270,
      calories: 580.0,
      protein: 17.3,
      fat: 27.7,
      carbs: 63.9,
      fiber: 3.8,
    }
  );

  // --- DAY 5 (2026-10-09) ---
  const d5Date = makeUtcDate(dateMap.day_5);
  entriesToInsert.push(
    // Breakfast: 456.7 kcal
    {
      date: d5Date,
      mealType: "BREAKFAST",
      name: "Варена сочевиця з куркою",
      recipeId: l1?.recipeId,
      ingredientId: l1?.ingredientId,
      weightGrams: 412,
      calories: 333.7,
      protein: 33.6,
      fat: 3.0,
      carbs: 42.0,
      fiber: 10.1,
    },
    {
      date: d5Date,
      mealType: "BREAKFAST",
      name: "Морква по-корейськи",
      recipeId: k1?.recipeId,
      ingredientId: k1?.ingredientId,
      weightGrams: 100,
      calories: 65.0,
      protein: 1.6,
      fat: 2.3,
      carbs: 9.4,
      fiber: 2.5,
    },
    {
      date: d5Date,
      mealType: "BREAKFAST",
      name: "Сметана 10%",
      weightGrams: 50,
      calories: 58.0,
      protein: 1.5,
      fat: 5.0,
      carbs: 1.8,
      fiber: 0.0,
    },
    // Lunch: 593.4 kcal
    {
      date: d5Date,
      mealType: "LUNCH",
      name: "Плов із булгуром та свинячим битком",
      recipeId: pl1?.recipeId,
      ingredientId: pl1?.ingredientId,
      weightGrams: 400,
      calories: 520.0,
      protein: 33.8,
      fat: 14.1,
      carbs: 63.8,
      fiber: 9.6,
    },
    {
      date: d5Date,
      mealType: "LUNCH",
      name: "Салат зі свіжої капусти та моркви",
      recipeId: c1?.recipeId,
      ingredientId: c1?.ingredientId,
      weightGrams: 100,
      calories: 27.0,
      protein: 1.3,
      fat: 0.1,
      carbs: 5.3,
      fiber: 2.0,
    },
    {
      date: d5Date,
      mealType: "LUNCH",
      name: "Сметана 10%",
      weightGrams: 40,
      calories: 46.4,
      protein: 1.2,
      fat: 4.0,
      carbs: 1.4,
      fiber: 0.0,
    },
    // Dinner: 842.9 kcal
    {
      date: d5Date,
      mealType: "DINNER",
      name: "Злаковий батончик (40 г) + протеїновий Vale (80 г) + Super Kontik (90 г)",
      weightGrams: 210,
      calories: 842.9,
      protein: 35.8,
      fat: 31.3,
      carbs: 105.8,
      fiber: 8.0,
    }
  );

  // --- DAY 6 (2026-10-10) ---
  const d6Date = makeUtcDate(dateMap.day_6);
  const cutlets = findDish("Котлети з курячого філе");
  entriesToInsert.push(
    // Breakfast (pre_donation): 90 kcal
    {
      date: d6Date,
      mealType: "BREAKFAST",
      name: "Сік яблучний/фруктовий",
      weightGrams: 200,
      calories: 90.0,
      protein: 0.5,
      fat: 0.2,
      carbs: 21.6,
      fiber: 0.4,
    },
    // Snack 1 (at_donation_center): 480 kcal
    {
      date: d6Date,
      mealType: "SNACK_1",
      name: "Печиво Марія (8 шт.) + чай із цукром + сінабон + какао",
      weightGrams: 350,
      calories: 480.0,
      protein: 6.0,
      fat: 11.0,
      carbs: 88.0,
      fiber: 1.5,
    },
    // Lunch: 1150 kcal
    {
      date: d6Date,
      mealType: "LUNCH",
      name: "Аранчіні болоньєзе (150/50 г із соусом дорблю) + піца Капрічоза (250 г)",
      weightGrams: 450,
      calories: 1150.0,
      protein: 45.0,
      fat: 42.0,
      carbs: 148.0,
      fiber: 5.5,
    },
    // Snack 2: 450 kcal
    {
      date: d6Date,
      mealType: "SNACK_2",
      name: "Сік фруктовий (200 мл) + печиво Тет-а-Тет полуничне (75 г)",
      weightGrams: 275,
      calories: 450.0,
      protein: 4.5,
      fat: 15.0,
      carbs: 74.0,
      fiber: 1.2,
    },
    // Dinner: 657 kcal
    {
      date: d6Date,
      mealType: "DINNER",
      name: "Печена картопля без олії (350 г) + морква по-корейськи (100 г) + кетчуп + котлети курячі (100 г)",
      recipeId: cutlets?.recipeId,
      ingredientId: cutlets?.ingredientId,
      weightGrams: 650,
      calories: 657.0,
      protein: 40.7,
      fat: 19.1,
      carbs: 81.8,
      fiber: 7.5,
    }
  );

  // --- DAYS 7, 8, 9 from meal_breakdown ---
  const breakdownMealMap: Record<string, MealType> = {
    breakfast: "BREAKFAST",
    lunch: "LUNCH",
    dinner: "DINNER",
    snacks: "SNACK_1",
    snack: "SNACK_1",
  };

  for (const dayKey of ["day_7", "day_8", "day_9"]) {
    const dayData = data.log[dayKey];
    const dateStr = dateMap[dayKey];
    const dayDate = makeUtcDate(dateStr);

    if (dayData.meal_breakdown) {
      for (const [mealName, items] of Object.entries(dayData.meal_breakdown as Record<string, BreakdownItem[]>)) {
        const mealType = breakdownMealMap[mealName.toLowerCase()] || "SNACK_1";
        for (const item of items) {
          const matchedDish = findDish(item.name);
          const weight = item.weight_g ?? item.edible_weight_g ?? (item.pieces ? item.pieces * 50 : undefined);

          entriesToInsert.push({
            date: dayDate,
            mealType,
            name: item.name,
            recipeId: matchedDish?.recipeId,
            ingredientId: matchedDish?.ingredientId,
            weightGrams: weight,
            calories: item.calories,
            protein: item.protein,
            fat: item.fat,
            carbs: item.carbs,
            fiber: item.fiber || 0,
          });
        }
      }
    }
  }

  console.log(`--- Inserting ${entriesToInsert.length} food log entries into database ---`);

  // Insert in batch
  for (const entry of entriesToInsert) {
    await prisma.foodLogEntry.create({
      data: {
        date: entry.date,
        mealType: entry.mealType,
        name: entry.name,
        recipeId: entry.recipeId || null,
        ingredientId: entry.ingredientId || null,
        weightGrams: entry.weightGrams ?? null,
        calories: entry.calories,
        protein: entry.protein,
        fat: entry.fat,
        carbs: entry.carbs,
        fiber: entry.fiber,
      },
    });
  }

  console.log("All entries inserted successfully!");

  // Verify daily totals for each day
  console.log("\n================ DAILY VERIFICATION ================");
  for (let i = 1; i <= 9; i++) {
    const dayKey = `day_${i}`;
    const dateStr = dateMap[dayKey];
    const dayDate = makeUtcDate(dateStr);

    const loggedEntries = await prisma.foodLogEntry.findMany({
      where: { date: dayDate },
    });

    const sum = loggedEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + Number(e.calories),
        protein: acc.protein + Number(e.protein),
        fat: acc.fat + Number(e.fat),
        carbs: acc.carbs + Number(e.carbs),
        fiber: acc.fiber + Number(e.fiber),
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
    );

    const expected = data.log[dayKey].totals;
    console.log(
      `${dayKey} (${dateStr}): ${loggedEntries.length} items | Cal: ${sum.calories.toFixed(1)} / ${expected.calories.toFixed(1)} | P: ${sum.protein.toFixed(1)} / ${expected.protein.toFixed(1)} | F: ${sum.fat.toFixed(1)} / ${expected.fat.toFixed(1)} | C: ${sum.carbs.toFixed(1)} / ${expected.carbs.toFixed(1)} | Fib: ${sum.fiber.toFixed(1)} / ${expected.fiber.toFixed(1)}`
    );
  }
  console.log("====================================================\n");
}

main()
  .catch((err) => {
    console.error("Import failed with error:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
